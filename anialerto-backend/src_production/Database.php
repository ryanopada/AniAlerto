<?php
class Database {
    private $host = "localhost";
    private $db_name = "u268935662_AniAlerto";
    private $username = "u268935662_anialerto123";     
    private $password = "AniAlerto123";       
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8mb4"); $this->conn->exec("SET time_zone = '+08:00'"); 
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>