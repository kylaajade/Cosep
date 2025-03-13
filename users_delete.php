<?php
include('connection.php');

header('Content-Type: application/json');

try {
    // Validate student_id
    if (empty($_POST['student_id'])) {
        throw new Exception("Student ID is required");
    }
    
    $studentId = $_POST['student_id'];
    
    // Fetch current image path
    $fetchImageQuery = "SELECT profile_image FROM students WHERE student_id = :student_id";
    $fetchImageStmt = $connection->prepare($fetchImageQuery);
    $fetchImageStmt->bindParam(':student_id', $studentId);
    $fetchImageStmt->execute();
    $currentImagePath = $fetchImageStmt->fetchColumn();
    
    // Delete the student record
    $query = "DELETE FROM students WHERE student_id = :student_id";
    $statement = $connection->prepare($query);
    $statement->bindParam(':student_id', $studentId);
    
    if ($statement->execute()) {
        // Delete the image if it exists
        if ($currentImagePath && file_exists($currentImagePath)) {
            unlink($currentImagePath);
        }
        
        echo json_encode(['res' => 'success']);
    } else {
        throw new Exception("Delete failed");
    }
} catch (\PDOException $e) {
    echo json_encode(['res' => 'error', 'error' => $e->getMessage()]);
} catch (\Exception $e) {
    echo json_encode(['res' => 'error', 'error' => $e->getMessage()]);
}