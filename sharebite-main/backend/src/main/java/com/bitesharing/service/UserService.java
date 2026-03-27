package com.bitesharing.service;

import com.bitesharing.dto.UserResponse;
import com.bitesharing.model.User;
import com.bitesharing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByType(User.UserType userType) {
        return userRepository.findByUserType(userType).stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getPendingUsers() {
        return userRepository.findByStatus(User.UserStatus.PENDING).stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public UserResponse getUserResponseById(Long id) {
        User user = getUserById(id);
        return UserResponse.fromUser(user);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, User.UserStatus status) {
        try {
            log.info("Updating user status: userId={}, status={}", userId, status);
            
            // Validate inputs
            if (userId == null || userId <= 0) {
                throw new IllegalArgumentException("Invalid user ID: " + userId);
            }
            
            if (status == null) {
                throw new IllegalArgumentException("Status cannot be null");
            }
            
            // Get user and validate existence
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            User.UserStatus oldStatus = user.getStatus();
            log.debug("Found user: id={}, currentStatus={}, username={}, email={}", 
                    user.getId(), oldStatus, user.getUsername(), user.getEmail());
            
            // Update status
            user.setStatus(status);
            
            // Ensure updatedAt is set (in case @PreUpdate doesn't fire)
            if (user.getUpdatedAt() == null || user.getCreatedAt() == null) {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                if (user.getCreatedAt() == null) {
                    user.setCreatedAt(now);
                }
                user.setUpdatedAt(now);
            }
            
            // Save and flush to ensure persistence
            User savedUser = userRepository.saveAndFlush(user);
            
            // Verify the save worked
            if (savedUser == null) {
                throw new RuntimeException("User save returned null");
            }
            
            log.info("Successfully updated user status: userId={}, oldStatus={}, newStatus={}", 
                    userId, oldStatus, savedUser.getStatus());
            
            // Convert to response DTO
            UserResponse response;
            try {
                response = UserResponse.fromUser(savedUser);
            } catch (Exception e) {
                log.error("Failed to convert User to UserResponse: userId={}, error={}", userId, e.getMessage(), e);
                throw new RuntimeException("Failed to serialize user response: " + e.getMessage(), e);
            }
            
            if (response == null) {
                throw new RuntimeException("UserResponse.fromUser returned null");
            }
            
            log.debug("UserResponse created successfully: id={}, status={}, email={}", 
                    response.getId(), response.getStatus(), response.getEmail());
            
            return response;
        } catch (IllegalArgumentException e) {
            log.error("IllegalArgumentException updating user status: userId={}, status={}, error={}", 
                    userId, status, e.getMessage());
            throw e;
        } catch (RuntimeException e) {
            log.error("RuntimeException updating user status: userId={}, status={}, error={}", 
                    userId, status, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error updating user status: userId={}, status={}, error={}, class={}", 
                    userId, status, e.getMessage(), e.getClass().getName(), e);
            throw new RuntimeException("Failed to update user status: " + e.getMessage(), e);
        }
    }

    @Transactional
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

