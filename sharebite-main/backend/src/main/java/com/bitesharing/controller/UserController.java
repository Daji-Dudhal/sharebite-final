package com.bitesharing.controller;

import com.bitesharing.dto.ErrorResponse;
import com.bitesharing.model.User;
import com.bitesharing.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Database connection error. Please check your database configuration.", "DATABASE_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching users: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.getUserById(id));
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Database connection error. Please check your database configuration.", "DATABASE_ERROR"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage(), "USER_NOT_FOUND"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching user", "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/type/{userType}")
    public ResponseEntity<?> getUsersByType(@PathVariable String userType) {
        try {
            return ResponseEntity.ok(userService.getUsersByType(User.UserType.valueOf(userType.toUpperCase())));
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Database connection error. Please check your database configuration.", "DATABASE_ERROR"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid user type: " + userType, "INVALID_USER_TYPE"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching users", "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingUsers() {
        try {
            return ResponseEntity.ok(userService.getPendingUsers());
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Database connection error. Please check your database configuration.", "DATABASE_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching pending users: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            log.info("Received update user status request: id={}, status={}", id, status);
            
            // Validate ID
            if (id == null || id <= 0) {
                log.warn("Invalid user ID provided: {}", id);
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Invalid user ID: " + id, "INVALID_USER_ID"));
            }
            
            // Validate status parameter
            if (status == null || status.trim().isEmpty()) {
                log.warn("Missing status parameter for user id: {}", id);
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Status parameter is required", "MISSING_STATUS"));
            }
            
            // Parse status
            User.UserStatus userStatus;
            try {
                userStatus = User.UserStatus.valueOf(status.toUpperCase().trim());
                log.debug("Parsed status: {}", userStatus);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value provided: {}", status);
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Invalid status: " + status + ". Valid values are: PENDING, APPROVED, REJECTED", "INVALID_STATUS"));
            }
            
            // Call service
            log.info("Calling service to update user status: id={}, status={}", id, userStatus);
            var response = userService.updateUserStatus(id, userStatus);
            log.info("Successfully updated user status: id={}, newStatus={}", id, userStatus);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("IllegalArgumentException updating user status: id={}, status={}, error={}", 
                    id, status, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid request: " + e.getMessage(), "INVALID_REQUEST"));
        } catch (DataAccessException e) {
            log.error("DataAccessException updating user status: id={}, status={}, error={}", 
                    id, status, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Database connection error. Please check your database configuration.", "DATABASE_ERROR"));
        } catch (RuntimeException e) {
            log.error("RuntimeException updating user status: id={}, status={}, error={}", 
                    id, status, e.getMessage(), e);
            String message = e.getMessage();
            if (message != null && message.toLowerCase().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse(message, "USER_NOT_FOUND"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to update user status: " + (message != null ? message : "Unknown error"), "UPDATE_ERROR"));
        } catch (Exception e) {
            log.error("Unexpected exception updating user status: id={}, status={}, error={}, class={}", 
                    id, status, e.getMessage(), e.getClass().getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An unexpected error occurred while updating user status: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }
}

