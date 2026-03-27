package com.bitesharing.service;

import com.bitesharing.model.Donation;
import com.bitesharing.model.PointsHistory;
import com.bitesharing.model.User;
import com.bitesharing.repository.DonationRepository;
import com.bitesharing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    @Transactional
    public Donation createDonation(Donation donation, Long donorId) {
        User donor = userRepository.findById(donorId)
                .orElseThrow(() -> new RuntimeException("Donor not found"));
        donation.setDonor(donor);
        donation.setStatus(Donation.DonationStatus.PENDING);
        Donation savedDonation = donationRepository.save(donation);
        
        // Award points for donation
        gamificationService.addPoints(donorId, 10, "Created food donation: " + donation.getFoodName(),
                PointsHistory.RelatedEntityType.DONATION, savedDonation.getId());
        
        return savedDonation;
    }

    public List<Donation> getAllDonations() {
        return donationRepository.findAll();
    }

    public List<Donation> getDonationsByDonor(Long donorId) {
        return donationRepository.findByDonorId(donorId);
    }

    public List<Donation> getDonationsByType(Donation.DonationType type) {
        return donationRepository.findByDonationType(type);
    }

    public List<Donation> getAvailableDonations(Donation.DonationType type) {
        return donationRepository.findByDonationTypeAndStatus(type, Donation.DonationStatus.PENDING);
    }

    public Donation getDonationById(Long id) {
        return donationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found"));
    }

    @Transactional
    public Donation updateDonationStatus(Long id, Donation.DonationStatus status) {
        Donation donation = getDonationById(id);
        donation.setStatus(status);
        return donationRepository.save(donation);
    }

    @Transactional
    public void checkAndMarkExpiredDonations() {
        LocalDateTime now = LocalDateTime.now();
        List<Donation> expiredDonations = donationRepository.findByStatusAndExpiryDateBefore(
                Donation.DonationStatus.PENDING, now);
        expiredDonations.forEach(donation -> {
            donation.setStatus(Donation.DonationStatus.EXPIRED);
            donationRepository.save(donation);
        });
    }
}

