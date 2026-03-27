package com.bitesharing.controller;

import com.bitesharing.model.Tracking;
import com.bitesharing.repository.RequestRepository;
import com.bitesharing.repository.TrackingRepository;
import com.bitesharing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TrackingController {

    private final TrackingRepository trackingRepository;
    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<Tracking> updateLocation(
            @RequestParam Long requestId,
            @RequestParam Long volunteerId,
            @RequestParam Double latitude,
            @RequestParam Double longitude) {
        try {
            Tracking tracking = new Tracking();
            tracking.setRequest(requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Request not found")));
            tracking.setVolunteer(userRepository.findById(volunteerId)
                    .orElseThrow(() -> new RuntimeException("Volunteer not found")));
            tracking.setLatitude(latitude);
            tracking.setLongitude(longitude);

            tracking = trackingRepository.save(tracking);

            // Send to WebSocket subscribers
            messagingTemplate.convertAndSend("/topic/tracking/" + requestId, tracking);

            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<Tracking>> getTrackingByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(trackingRepository.findByRequestIdOrderByTimestampDesc(requestId));
    }

    @GetMapping("/request/{requestId}/latest")
    public ResponseEntity<Tracking> getLatestTracking(@PathVariable Long requestId) {
        Tracking tracking = trackingRepository.findFirstByRequestIdOrderByTimestampDesc(requestId);
        if (tracking != null) {
            return ResponseEntity.ok(tracking);
        }
        return ResponseEntity.notFound().build();
    }
}

