package com.bitesharing.controller;

import com.bitesharing.dto.ErrorResponse;
import com.bitesharing.model.Donation;
import com.bitesharing.service.DonationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class DonationController {

    private final DonationService donationService;

    @PostMapping
    public ResponseEntity<?> createDonation(
            @RequestBody Donation donation,
            @RequestParam Long donorId,
            HttpServletRequest request // <-- ADD THIS
    ) {
        try {

            System.out.println("======= DONATION CONTROLLER DEBUG =======");
            System.out.println("Authorization header received:");
            System.out.println(request.getHeader("Authorization"));
            System.out.println("========================================");

            return ResponseEntity.ok(donationService.createDonation(donation, donorId));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), "DONATION_ERROR"));
        } catch (Exception e) {
            log.error("Error creating donation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while creating donation: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }


    @GetMapping
    public ResponseEntity<?> getAllDonations() {
        try {
            List<Donation> donations = donationService.getAllDonations();
            log.debug("Retrieved {} donations", donations.size());
            return ResponseEntity.ok(donations);
        } catch (DataAccessException e) {
            log.error("Database error fetching donations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Database connection error. Please check your database configuration.", "DATABASE_ERROR"));
        } catch (Exception e) {
            log.error("Error fetching donations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching donations: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDonationById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(donationService.getDonationById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage(), "DONATION_NOT_FOUND"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching donation", "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<Donation>> getDonationsByDonor(@PathVariable Long donorId) {
        try {
            return ResponseEntity.ok(donationService.getDonationsByDonor(donorId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<?> getDonationsByType(@PathVariable String type) {
        try {
            return ResponseEntity.ok(donationService.getDonationsByType(
                    Donation.DonationType.valueOf(type.toUpperCase())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid donation type: " + type, "INVALID_TYPE"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching donations", "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/available/{type}")
    public ResponseEntity<?> getAvailableDonations(@PathVariable String type) {
        try {
            return ResponseEntity.ok(donationService.getAvailableDonations(
                    Donation.DonationType.valueOf(type.toUpperCase())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid donation type: " + type, "INVALID_TYPE"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching available donations", "INTERNAL_ERROR"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateDonationStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            Donation.DonationStatus donationStatus = Donation.DonationStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(donationService.updateDonationStatus(id, donationStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid status: " + status, "INVALID_STATUS"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage(), "DONATION_NOT_FOUND"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while updating donation status", "INTERNAL_ERROR"));
        }
    }
}

