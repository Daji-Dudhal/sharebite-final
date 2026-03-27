package com.bitesharing.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    private String userType;
}

