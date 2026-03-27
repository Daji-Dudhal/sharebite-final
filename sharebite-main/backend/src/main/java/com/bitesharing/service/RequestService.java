package com.bitesharing.service;

import com.bitesharing.model.Donation;
import com.bitesharing.model.PointsHistory;
import com.bitesharing.model.Request;
import com.bitesharing.model.User;
import com.bitesharing.repository.DonationRepository;
import com.bitesharing.repository.RequestRepository;
import com.bitesharing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    @Transactional
    public Request createRequest(Long donationId, Long requesterId, Request.RequesterType requesterType) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found"));

        if (donation.getStatus() != Donation.DonationStatus.PENDING) {
            throw new RuntimeException("Donation is not available");
        }

        User requester = null;
        if (requesterId != null) {
            requester = userRepository.findById(requesterId)
                    .orElseThrow(() -> new RuntimeException("Requester not found"));
        }

        Request request = new Request();
        request.setDonation(donation);
        request.setRequester(requester);
        request.setRequesterType(requesterType);
        request.setStatus(Request.RequestStatus.PENDING);

        request = requestRepository.save(request);

        // Update donation status
        donation.setStatus(Donation.DonationStatus.ACCEPTED);
        donationRepository.save(donation);

        return request;
    }

    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<Request> getRequestsByRequester(Long requesterId) {
        return requestRepository.findByRequesterId(requesterId);
    }

    public List<Request> getRequestsByVolunteer(Long volunteerId) {
        return requestRepository.findByAssignedVolunteerId(volunteerId);
    }

    public List<Request> getRequestsByDonation(Long donationId) {
        return requestRepository.findByDonationId(donationId);
    }

    public List<Request> getRequestsByDonor(Long donorId) {
        return requestRepository.findByDonationDonorId(donorId);
    }

    public Request getRequestById(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
    }

    @Transactional
    public Request assignVolunteer(Long requestId, Long volunteerId) {
        Request request = getRequestById(requestId);
        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new RuntimeException("Volunteer not found"));

        if (volunteer.getUserType() != User.UserType.VOLUNTEER) {
            throw new RuntimeException("User is not a volunteer");
        }

        request.setAssignedVolunteer(volunteer);
        request.setStatus(Request.RequestStatus.ACCEPTED);
        return requestRepository.save(request);
    }

    @Transactional
    public Request updateRequestStatus(Long id, Request.RequestStatus status) {
        return updateRequestStatus(id, status, null, null);
    }

    @Transactional
    public Request updateRequestStatus(Long id, Request.RequestStatus status, String deliveryProofUrl, String deliveryProofNote) {
        Request request = getRequestById(id);
        Request.RequestStatus oldStatus = request.getStatus();
        request.setStatus(status);

        if (status == Request.RequestStatus.DELIVERED) {
            request.setDeliveredAt(LocalDateTime.now());
            if (deliveryProofUrl != null && !deliveryProofUrl.isBlank()) {
                request.setDeliveryProofUrl(deliveryProofUrl);
            }
            if (deliveryProofNote != null && !deliveryProofNote.isBlank()) {
                request.setDeliveryProofNote(deliveryProofNote.trim());
            }
            request.getDonation().setStatus(Donation.DonationStatus.DELIVERED);
            donationRepository.save(request.getDonation());
        }

        Request savedRequest = requestRepository.save(request);
        
        // Award points for completed delivery
        if (status == Request.RequestStatus.DELIVERED && oldStatus != Request.RequestStatus.DELIVERED) {
            if (savedRequest.getAssignedVolunteer() != null) {
                gamificationService.addPoints(savedRequest.getAssignedVolunteer().getId(), 15,
                        "Completed delivery for: " + savedRequest.getDonation().getFoodName(),
                        PointsHistory.RelatedEntityType.DELIVERY, savedRequest.getId());
            }
        }
        
        // Award points for composting
        if (status == Request.RequestStatus.COMPOSTED && oldStatus != Request.RequestStatus.COMPOSTED) {
            if (savedRequest.getRequester() != null) {
                gamificationService.addPoints(savedRequest.getRequester().getId(), 20,
                        "Composted: " + savedRequest.getDonation().getFoodName(),
                        PointsHistory.RelatedEntityType.COMPOST, savedRequest.getId());
            }
        }
        
        return savedRequest;
    }
}

