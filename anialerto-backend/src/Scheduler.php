<?php
final class Scheduler
{
    public function run(): array
    {
        $pdo = Database::getConnection();
        $today = date('Y-m-d');

        $batches = $pdo->query("SELECT * FROM farm_batches WHERE status = 'Active'")->fetchAll();
        $createdTasks = 0;
        $queuedMessages = 0;

        foreach ($batches as $batch) {
            $cropDay = (int) floor((strtotime($today) - strtotime($batch['planting_date'])) / 86400);
            if ($cropDay < 0) {
                continue;
            }

            $templates = $this->getDueTemplates($pdo, $cropDay);
            foreach ($templates as $template) {
                $taskId = $this->createTaskIfMissing($pdo, (int)$batch['id'], (int)$template['id'], $today);
                if ($taskId === null) {
                    continue;
                }
                $createdTasks++;

                $workers = $this->getBatchWorkers($pdo, (int)$batch['id']);
                foreach ($workers as $worker) {
                    $message = $this->renderTemplate($template['message'], $batch, $worker, $cropDay);
                    $this->queueSms($pdo, $taskId, (int)$worker['id'], $worker['phone'], $message);
                    $queuedMessages++;
                }
            }
        }

        return [
            'date' => $today,
            'active_batches_checked' => count($batches),
            'tasks_created' => $createdTasks,
            'messages_queued' => $queuedMessages,
        ];
    }

    private function getDueTemplates(PDO $pdo, int $cropDay): array
    {
        $stmt = $pdo->prepare(
            "SELECT * FROM message_templates
             WHERE active = 1
             AND trigger_type = 'days_after_planting'
             AND days_after_planting = ?"
        );
        $stmt->execute([$cropDay]);
        return $stmt->fetchAll();
    }

    private function createTaskIfMissing(PDO $pdo, int $batchId, int $templateId, string $dueDate): ?int
    {
        $check = $pdo->prepare(
            "SELECT id FROM scheduled_tasks WHERE batch_id = ? AND template_id = ? AND due_date = ? LIMIT 1"
        );
        $check->execute([$batchId, $templateId, $dueDate]);
        $existing = $check->fetch();
        if ($existing) {
            return null;
        }

        $insert = $pdo->prepare(
            "INSERT INTO scheduled_tasks (batch_id, template_id, due_date, status, created_at)
             VALUES (?, ?, ?, 'Pending', NOW())"
        );
        $insert->execute([$batchId, $templateId, $dueDate]);
        return (int)$pdo->lastInsertId();
    }

    private function getBatchWorkers(PDO $pdo, int $batchId): array
    {
        $stmt = $pdo->prepare(
            "SELECT w.* FROM workers w
             INNER JOIN batch_workers bw ON bw.worker_id = w.id
             WHERE bw.batch_id = ? AND w.status = 'Active'"
        );
        $stmt->execute([$batchId]);
        return $stmt->fetchAll();
    }

    private function renderTemplate(array|string $message, array $batch, array $worker, int $cropDay): string
    {
        $message = (string)$message;
        $replacements = [
            '{worker_name}' => $worker['name'],
            '{batch_name}' => $batch['name'],
            '{location}' => $batch['location'],
            '{crop_day}' => (string)$cropDay,
            '{planting_date}' => $batch['planting_date'],
        ];
        return strtr($message, $replacements);
    }

    private function queueSms(PDO $pdo, int $taskId, int $workerId, string $phone, string $message): void
    {
        $stmt = $pdo->prepare(
            "INSERT INTO sms_queue (task_id, worker_id, phone, message, status, attempts, created_at)
             VALUES (?, ?, ?, ?, 'Queued', 0, NOW())"
        );
        $stmt->execute([$taskId, $workerId, $phone, $message]);
    }
}
