$(document).ready(function() {

    loadStudents();
    
    function loadStudents() {
        $.ajax({
            url: 'get_user.php',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log('Data fetched:', data);
                $("#tableBody").empty();
                
                if (!Array.isArray(data)) {
                    if (data.error) {
                        alert("Error: " + data.error);
                    } else if (data.info) {
                        $("#tableBody").html('<tr><td colspan="10" class="text-center">No students found</td></tr>');
                    }
                    return;
                }
                
                data.forEach(function(item) {
                    let age = calculateAge(item.birthdate);
                    let profileImageHtml = item.profile_image 
                        ? `<img src="${item.profile_image}" alt="Profile Image" style="width:50px;height:50px;border-radius:50%;">`
                        : 'N/A';
                
                    var row = `
                    <tr>
                        <td>${item.student_id}</td>
                        <td>${item.first_name}</td>
                        <td>${item.last_name}</td>
                        <td>${item.email}</td>
                        <td>${item.gender}</td>
                        <td>${item.course}</td>
                        <td>${item.user_address || 'N/A'}</td>
                        <td>${age}</td>
                        <td class="profile-image-cell" data-student-id="${item.student_id}">${profileImageHtml}</td>
                        <td class="action-buttons">
                            <button class="btn btn-sm btn-info edit-btn" data-toggle="modal" data-target="#exampleModal"
                                data-id="${item.student_id}" 
                                data-first-name="${item.first_name}" 
                                data-last-name="${item.last_name}" 
                                data-email="${item.email}" 
                                data-gender="${item.gender}" 
                                data-course="${item.course}" 
                                data-address="${item.user_address || ''}" 
                                data-birthdate="${item.birthdate}"
                                data-profile-image="${item.profile_image || ''}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${item.student_id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    `;
                    $("#tableBody").append(row);
                });
                
                addEventListeners();
            },
            error: function(xhr, status, error) {
                console.error('Error fetching students:', error);
                alert("Error loading students: " + error);
            }
        });
    }
    
    // Calculate age based on birthdate
    function calculateAge(birthdate) {
        if (!birthdate) return 'N/A';
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    
    // Add image preview functionality
    $("#ProfileImage").on("change", function() {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $("#imagePreview").attr("src", e.target.result);
                $("#imagePreviewContainer").show();
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Bind click events for edit and delete buttons
    function addEventListeners() {
        $(".edit-btn").on("click", function() {
            let studentId = $(this).data('id');
            let firstName = $(this).data('first-name');
            let lastName = $(this).data('last-name');
            let email = $(this).data('email');
            let gender = $(this).data('gender');
            let course = $(this).data('course');
            let address = $(this).data('address');
            let birthdate = $(this).data('birthdate');
            let profileImage = $(this).data('profile-image');
            
            $("#exampleModalLabel").text("Edit Student");
            $("#student_id").val(studentId);
            $("#firstName").val(firstName);
            $("#lastName").val(lastName);
            $("#Email").val(email);
            $("#Gender").val(gender);
            $("#Course").val(course);
            $("#Address").val(address);
            $("#Birthdate").val(birthdate);
            
            // Add image preview if available
            if (profileImage) {
                $("#currentImageContainer").show();
                $("#currentImage").attr("src", profileImage);
            } else {
                $("#currentImageContainer").hide();
            }
            
            // Reset file input and preview
            $("#ProfileImage").val('');
            $("#imagePreviewContainer").hide();
        });
        
        $(".delete-btn").on("click", function() {
            let studentId = $(this).data('id');
            $("#delete_student_id").val(studentId);
            $("#deleteModal").modal('show');
        });
    }
    
    // Reset the form for new student insertion
    $("#btnCreateStudent").on("click", function() {
        $("#newUserForm")[0].reset();
        $("#student_id").val('');
        $("#exampleModalLabel").text("Insert User");
        $("#currentImageContainer").hide();
        $("#imagePreviewContainer").hide();
    });
    
    // Save student using FormData (includes file upload)
    $("#btnSaveUser").on("click", function() {
        console.log("btnSaveUser clicked");
    
        if (
          !$("#firstName").val() ||
          !$("#lastName").val() ||
          !$("#Email").val()  || 
          !$("#Gender").val() ||
          !$("#Course").val() ||
          !$("#Birthdate").val()
        ) {
            alert("Please fill in all required fields");
            return;
        }

        let studentId = $("#student_id").val();
        let isNewStudent = !studentId;
        
        // Check if image is required for new student
        if (isNewStudent && !$("#ProfileImage")[0].files[0]) {
            alert("Please select a profile image");
            return;
        }
        
        let url = isNewStudent ? 'users_create.php' : 'users_update.php';
        let formData = new FormData($("#newUserForm")[0]);
        
        console.log("Submitting form data to:", url);
        
        $.ajax({
            url: url,
            type: "POST",
            dataType: "json",
            data: formData,
            processData: false,
            contentType: false,
            success: function(result) {
                console.log("AJAX response:", result);
                if (result.res === "success") {
                    alert("Student saved successfully!");
                    $("#exampleModal").modal("hide");
                    
                    if (!isNewStudent && result.image_updated && result.new_image_path) {
                        // Update the image in the table without reloading all data
                        updateStudentImage(studentId, result.new_image_path);
                    } else {
                        // Reload all students data
                        loadStudents();
                    }
                } else {
                    alert(result.error || "Unknown error occurred");
                }
            },
            error: function(xhr, status, error) {
                console.error("AJAX error:", error);
                console.error("Response:", xhr.responseText);
                alert("Server error occurred. Check console for details.");
            }
        });
    });
    
    // Update student image in the table without reloading all data
    function updateStudentImage(studentId, newImagePath) {
        let imageCell = $(`.profile-image-cell[data-student-id="${studentId}"]`);
        if (imageCell.length) {
            imageCell.html(`<img src="${newImagePath}" alt="Profile Image" style="width:50px;height:50px;border-radius:50%;">`);
        } else {
            // If we can't find the cell, reload all data
            loadStudents();
        }
    }
    
    $("#confirmDelete").on("click", function() {
        let studentId = $("#delete_student_id").val();
        $.ajax({
            url: 'users_delete.php',
            type: "POST",
            dataType: "json",
            data: { student_id: studentId },
            success: function(result) {
                if (result.res === "success") {
                    alert("Student deleted successfully!");
                    $("#deleteModal").modal("hide");
                    loadStudents();
                } else {
                    alert(result.error || "Unknown error occurred");
                }
            },
            error: function(xhr, status, error) {
                console.error('Delete error:', error);
                console.error("Response:", xhr.responseText);
                alert("Server error occurred. Check console for details.");
            }
        });
    });
});