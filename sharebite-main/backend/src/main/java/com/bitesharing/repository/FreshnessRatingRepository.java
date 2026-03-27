package com.bitesharing.repository;

import com.bitesharing.model.FreshnessRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FreshnessRatingRepository extends JpaRepository<FreshnessRating, Long> {
    List<FreshnessRating> findByDonationId(Long donationId);
    
    boolean existsByDonationIdAndRatedById(Long donationId, Long ratedById);
    
    List<FreshnessRating> findByDonationIdOrderByCreatedAtDesc(Long donationId);
}

