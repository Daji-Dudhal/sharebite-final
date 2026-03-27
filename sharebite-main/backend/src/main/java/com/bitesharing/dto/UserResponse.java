package com.bitesharing.dto;

import com.bitesharing.model.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    private User.UserType userType;
    private User.UserStatus status;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    public static UserResponse fromUser(User user) {
        if (user == null) {
            return null;
        }
        try {
            return new UserResponse(
                    user.getId(),
                    user.getUsername() != null ? user.getUsername() : "",
                    user.getEmail() != null ? user.getEmail() : "",
                    user.getFullName() != null ? user.getFullName() : "",
                    user.getPhone() != null ? user.getPhone() : "",
                    user.getAddress() != null ? user.getAddress() : "",
                    user.getLatitude(),
                    user.getLongitude(),
                    user.getUserType() != null ? user.getUserType() : User.UserType.NEEDY,
                    user.getStatus() != null ? user.getStatus() : User.UserStatus.PENDING,
                    user.getCreatedAt() != null ? user.getCreatedAt() : java.time.LocalDateTime.now(),
                    user.getUpdatedAt() != null ? user.getUpdatedAt() : java.time.LocalDateTime.now()
            );
        } catch (Exception e) {
            throw new RuntimeException("Error converting User to UserResponse for user ID " + 
                    (user.getId() != null ? user.getId() : "unknown") + ": " + e.getMessage(), e);
        }
    }
}

