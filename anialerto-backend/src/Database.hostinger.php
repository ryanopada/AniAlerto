<?php
class Database {
    // When uploaded to Hostinger, the host is usually "localhost"
    private $host = "localhost";
    
    // The database name you created in Hostinger
    private $db_name = "u268935662_AniAlerto";
    
    // REPLACE these two with the username and password you created in Hostinger "Databases"
    private $username = "REPLACE_WITH_YOUR_DB_USERNAME";     
    private $password = "REPLACE_WITH_YOUR_DB_PASSWORD";       
    
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            // Force Manila timezone for Hostinger
            $this->conn->exec("SET time_zone = '+08:00'");
            $this->conn->exec("set names utf8mb4"); 
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
