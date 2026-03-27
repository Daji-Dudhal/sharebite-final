package com.bitesharing.repository;

import com.bitesharing.model.Tracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrackingRepository extends JpaRepository<Tracking, Long> {
    List<Tracking> findByRequestIdOrderByTimestampDesc(Long requestId);
    List<Tracking> findByVolunteerIdOrderByTimestampDesc(Long volunteerId);
    Tracking findFirstByRequestIdOrderByTimestampDesc(Long requestId);
}

