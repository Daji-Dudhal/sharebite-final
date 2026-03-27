package com.bitesharing.repository;

import com.bitesharing.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
    List<Request> findByDonationId(Long donationId);
    List<Request> findByRequesterId(Long requesterId);
    List<Request> findByAssignedVolunteerId(Long volunteerId);
    List<Request> findByDonationDonorId(Long donorId);
    List<Request> findByStatus(Request.RequestStatus status);
    List<Request> findByRequesterType(Request.RequesterType requesterType);
    List<Request> findByRequesterTypeAndStatus(Request.RequesterType requesterType, Request.RequestStatus status);
}

