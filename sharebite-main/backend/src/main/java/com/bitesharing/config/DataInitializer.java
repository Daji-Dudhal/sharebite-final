package com.bitesharing.config;

import com.bitesharing.model.Badge;
import com.bitesharing.model.User;
import com.bitesharing.repository.BadgeRepository;
import com.bitesharing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            // Initialize badges if they don't exist
            if (badgeRepository.count() == 0) {
                log.info("Initializing badges...");
                badgeRepository.save(new Badge(null, "First Donation", "Made your first food donation", null, 10, null));
                badgeRepository.save(new Badge(null, "Hero Donor", "Donated 10 times", null, 100, null));
                badgeRepository.save(new Badge(null, "Super Hero", "Donated 50 times", null, 500, null));
                badgeRepository.save(new Badge(null, "First Delivery", "Completed your first delivery", null, 15, null));
                badgeRepository.save(new Badge(null, "Delivery Master", "Completed 20 deliveries", null, 300, null));
                badgeRepository.save(new Badge(null, "Compost Champion", "Helped compost 10 items", null, 150, null));
                badgeRepository.save(new Badge(null, "Community Leader", "Earned 1000 points", null, 1000, null));
                log.info("Badges initialized successfully");
            }

            // Create or update default admin user
            log.info("Checking admin user...");
            User admin = userRepository.findByUsername("admin").orElse(null);
            
            if (admin == null) {
                log.info("Creating admin user...");
                admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@bitesharing.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setFullName("System Admin");
                admin.setUserType(User.UserType.ADMIN);
                admin.setStatus(User.UserStatus.APPROVED);
                userRepository.save(admin);
                log.info("Admin user created successfully - Username: admin, Password: admin123");
            } else {
                // Ensure admin is approved and has correct password
                if (admin.getStatus() != User.UserStatus.APPROVED) {
                    log.warn("Admin user found but not approved. Updating status...");
                    admin.setStatus(User.UserStatus.APPROVED);
                    userRepository.save(admin);
                }
                // Reset admin password to default if needed (uncomment if you want to reset password)
                // admin.setPassword(passwordEncoder.encode("admin123"));
                // userRepository.save(admin);
                // log.info("Admin password reset to default");
                log.info("Admin user exists and is ready - Username: admin");
            }
        } catch (DataAccessException e) {
            log.error("Database connection error during initialization: {}", e.getMessage());
            log.error("Please check your database configuration in application.properties");
            throw new RuntimeException("Failed to initialize database. Check database connection.", e);
        } catch (Exception e) {
            log.error("Error during data initialization: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize application data", e);
        }
    }
}

