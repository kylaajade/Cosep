<?php
include('connection.php');

try {
    $query = "SELECT * FROM students";  
    $statement = $connection->prepare($query);
    $statement->execute();
    $result = $statement->fetchAll(PDO::FETCH_ASSOC);
    
 
    
    echo json_encode($result);
} catch (\PDOException $th) {
    error_log("Error fetching students: " . $th->getMessage());
    echo json_encode(['error' => 'Error fetching students: ' . $th->getMessage()]);
}