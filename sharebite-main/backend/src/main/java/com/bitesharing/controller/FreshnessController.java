package com.bitesharing.controller;

import com.bitesharing.dto.ErrorResponse;
import com.bitesharing.model.FreshnessRating;
import com.bitesharing.repository.DonationRepository;
import com.bitesharing.repository.FreshnessRatingRepository;
import com.bitesharing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/freshness")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class FreshnessController {

    private final FreshnessRatingRepository freshnessRatingRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> rateFreshness(
            @RequestParam Long donationId,
            @RequestParam Long userId,
            @RequestParam Integer rating,
            @RequestParam(required = false) String comment) {
        try {
            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Rating must be between 1 and 5", "INVALID_RATING"));
            }

            // Check if user already rated this donation
            if (freshnessRatingRepository.existsByDonationIdAndRatedById(donationId, userId)) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("You have already rated this donation", "ALREADY_RATED"));
            }

            // Validate donation and user exist
            if (!donationRepository.existsById(donationId)) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Donation not found", "DONATION_NOT_FOUND"));
            }

            if (!userRepository.existsById(userId)) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("User not found", "USER_NOT_FOUND"));
            }

            FreshnessRating freshnessRating = new FreshnessRating();
            freshnessRating.setDonation(donationRepository.findById(donationId).orElse(null));
            freshnessRating.setRatedBy(userRepository.findById(userId).orElse(null));
            freshnessRating.setRating(rating);
            freshnessRating.setComment(comment);

            FreshnessRating saved = freshnessRatingRepository.save(freshnessRating);
            log.info("Freshness rating created: donationId={}, userId={}, rating={}", donationId, userId, rating);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error creating freshness rating: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to create freshness rating: " + e.getMessage(), "RATING_ERROR"));
        }
    }

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<?> getFreshnessRatings(@PathVariable Long donationId) {
        try {
            List<FreshnessRating> ratings = freshnessRatingRepository.findByDonationIdOrderByCreatedAtDesc(donationId);
            
            // Calculate average rating
            double averageRating = ratings.stream()
                    .mapToInt(FreshnessRating::getRating)
                    .average()
                    .orElse(0.0);

            Map<String, Object> response = new HashMap<>();
            response.put("ratings", ratings);
            response.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
            response.put("totalRatings", ratings.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching freshness ratings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch freshness ratings: " + e.getMessage(), "FETCH_ERROR"));
        }
    }

    @GetMapping("/donation/{donationId}/summary")
    public ResponseEntity<?> getFreshnessSummary(@PathVariable Long donationId) {
        try {
            List<FreshnessRating> ratings = freshnessRatingRepository.findByDonationId(donationId);
            
            if (ratings.isEmpty()) {
                Map<String, Object> emptyResponse = new HashMap<>();
                emptyResponse.put("averageRating", 0.0);
                emptyResponse.put("totalRatings", 0);
                emptyResponse.put("ratingDistribution", Map.of());
                return ResponseEntity.ok(emptyResponse);
            }

            double averageRating = ratings.stream()
                    .mapToInt(FreshnessRating::getRating)
                    .average()
                    .orElse(0.0);

            Map<Integer, Long> distribution = ratings.stream()
                    .collect(Collectors.groupingBy(FreshnessRating::getRating, Collectors.counting()));

            Map<String, Object> response = new HashMap<>();
            response.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
            response.put("totalRatings", ratings.size());
            response.put("ratingDistribution", distribution);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching freshness summary: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch freshness summary: " + e.getMessage(), "FETCH_ERROR"));
        }
    }
}

