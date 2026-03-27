package com.bitesharing.repository;

import com.bitesharing.model.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByDonorId(Long donorId);
    List<Donation> findByDonationType(Donation.DonationType donationType);
    List<Donation> findByStatus(Donation.DonationStatus status);
    List<Donation> findByDonationTypeAndStatus(Donation.DonationType donationType, Donation.DonationStatus status);
    List<Donation> findByExpiryDateBefore(LocalDateTime dateTime);
    List<Donation> findByStatusAndExpiryDateBefore(Donation.DonationStatus status, LocalDateTime dateTime);
}

