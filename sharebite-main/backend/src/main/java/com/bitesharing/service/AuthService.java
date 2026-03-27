package com.bitesharing.service;

import com.bitesharing.dto.AuthRequest;
import com.bitesharing.dto.AuthResponse;
import com.bitesharing.dto.RegisterRequest;
import com.bitesharing.model.User;
import com.bitesharing.repository.UserRepository;
import com.bitesharing.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        user.setUserType(User.UserType.valueOf(request.getUserType().toUpperCase()));
        user.setStatus(User.UserStatus.PENDING);

        // Auto-approve ADMIN users
        if (user.getUserType() == User.UserType.ADMIN) {
            user.setStatus(User.UserStatus.APPROVED);
        }

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user);

        return new AuthResponse(token, user.getUsername(), user.getUserType().name(), user.getId());
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (user.getStatus() != User.UserStatus.APPROVED) {
            throw new RuntimeException("Account not approved yet");
        }

        String token = jwtUtil.generateToken(user);

        return new AuthResponse(token, user.getUsername(), user.getUserType().name(), user.getId());
    }
}

