<?php
include('connection.php');

header('Content-Type: application/json');

try {
    $requiredFields = ['student_id', 'first_name', 'last_name', 'email', 'gender', 'course', 'birthdate'];
    foreach ($requiredFields as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("$field is required");
        }
    }
    
    // Extract data from POST
    $studentId = $_POST['student_id'];
    $firstName = $_POST['first_name'];
    $lastName = $_POST['last_name'];
    $email = $_POST['email'];
    $gender = $_POST['gender'];
    $course = $_POST['course'];
    $userAddress = $_POST['address'] ?? null;
    $birthdate = $_POST['birthdate'];
    
    $checkQuery = "SELECT COUNT(*) FROM students WHERE email = :email AND student_id != :student_id";
    $checkStmt = $connection->prepare($checkQuery);
    $checkStmt->bindParam(':email', $email);
    $checkStmt->bindParam(':student_id', $studentId);
    $checkStmt->execute();
    
    if ($checkStmt->fetchColumn() > 0) {
        throw new Exception("Email already exists for another student");
    }
    
    // Fetch current image path
    $fetchImageQuery = "SELECT profile_image FROM students WHERE student_id = :student_id";
    $fetchImageStmt = $connection->prepare($fetchImageQuery);
    $fetchImageStmt->bindParam(':student_id', $studentId);
    $fetchImageStmt->execute();
    $currentImagePath = $fetchImageStmt->fetchColumn();
    
    // Image upload handling
    $profileImagePath = null;
    $imageUpdated = false;
    
    if (!empty($_FILES["profileImage"]["name"])) {
        $uploadDir = "profiles/";
        
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $imageName = time() . "_" . basename($_FILES["profileImage"]["name"]);
        $uploadFile = $uploadDir . $imageName;
        
        if (move_uploaded_file($_FILES["profileImage"]["tmp_name"], $uploadFile)) {
            $profileImagePath = $uploadFile;
            $imageUpdated = true;
            
            if ($currentImagePath && file_exists($currentImagePath)) {
                unlink($currentImagePath);
            }
        } else {
            throw new Exception("Image upload failed");
        }
    }
    

    
    // Create the query based on whether an image was uploaded
    if ($imageUpdated) {
        $query = "UPDATE students 
                  SET first_name = :first_name, 
                      last_name = :last_name, 
                      email = :email, 
                      gender = :gender, 
                      course = :course, 
                      user_address = :user_address, 
                      birthdate = :birthdate,
                      profile_image = :profile_image
                  WHERE student_id = :student_id";
    } else {
        $query = "UPDATE students 
                  SET first_name = :first_name, 
                      last_name = :last_name, 
                      email = :email, 
                      gender = :gender, 
                      course = :course, 
                      user_address = :user_address, 
                      birthdate = :birthdate
                  WHERE student_id = :student_id";
    }
              
    $statement = $connection->prepare($query);
    $statement->bindParam(':student_id', $studentId);
    $statement->bindParam(':first_name', $firstName);
    $statement->bindParam(':last_name', $lastName);
    $statement->bindParam(':email', $email);
    $statement->bindParam(':gender', $gender);
    $statement->bindParam(':course', $course);
    $statement->bindParam(':user_address', $userAddress);
    $statement->bindParam(':birthdate', $birthdate);
    
    if ($imageUpdated) {
        $statement->bindParam(':profile_image', $profileImagePath);
    }
    
    if ($statement->execute()) {
        echo json_encode([
            'res' => 'success',
            'image_updated' => $imageUpdated,
            'new_image_path' => $imageUpdated ? $profileImagePath : null
        ]);
    } else {
        throw new Exception("Update failed");
    }
} catch (\PDOException $e) {
    echo json_encode(['res' => 'error', 'error' => $e->getMessage()]);
} catch (\Exception $e) {
    echo json_encode(['res' => 'error', 'error' => $e->getMessage()]);
}