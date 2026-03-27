package com.bitesharing.repository;

import com.bitesharing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findByUserType(User.UserType userType);
    List<User> findByStatus(User.UserStatus status);
    List<User> findByUserTypeAndStatus(User.UserType userType, User.UserStatus status);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}

