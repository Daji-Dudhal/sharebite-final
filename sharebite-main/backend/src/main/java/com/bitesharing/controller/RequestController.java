package com.bitesharing.controller;

import com.bitesharing.dto.ErrorResponse;
import com.bitesharing.model.Request;
import com.bitesharing.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class RequestController {

    private final RequestService requestService;

    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestParam Long donationId,
            @RequestParam(required = false) Long requesterId,
            @RequestParam String requesterType) {
        try {
            Request.RequesterType type = Request.RequesterType.valueOf(requesterType.toUpperCase());
            return ResponseEntity.ok(requestService.createRequest(donationId, requesterId, type));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid requester type: " + requesterType, "INVALID_TYPE"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), "REQUEST_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while creating request", "INTERNAL_ERROR"));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllRequests() {
        try {
            return ResponseEntity.ok(requestService.getAllRequests());
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Database connection error. Please check your database configuration.", "DATABASE_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching requests: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRequestById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(requestService.getRequestById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage(), "REQUEST_NOT_FOUND"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while fetching request", "INTERNAL_ERROR"));
        }
    }

    @GetMapping("/requester/{requesterId}")
    public ResponseEntity<List<Request>> getRequestsByRequester(@PathVariable Long requesterId) {
        try {
            return ResponseEntity.ok(requestService.getRequestsByRequester(requesterId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Request>> getRequestsByVolunteer(@PathVariable Long volunteerId) {
        try {
            return ResponseEntity.ok(requestService.getRequestsByVolunteer(volunteerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<Request>> getRequestsByDonor(@PathVariable Long donorId) {
        try {
            return ResponseEntity.ok(requestService.getRequestsByDonor(donorId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<List<Request>> getRequestsByDonation(@PathVariable Long donationId) {
        try {
            return ResponseEntity.ok(requestService.getRequestsByDonation(donationId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignVolunteer(
            @PathVariable Long id,
            @RequestParam Long volunteerId) {
        try {
            return ResponseEntity.ok(requestService.assignVolunteer(id, volunteerId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), "ASSIGNMENT_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while assigning volunteer", "INTERNAL_ERROR"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String deliveryProofUrl,
            @RequestParam(required = false) String deliveryProofNote) {
        try {
            Request.RequestStatus requestStatus = Request.RequestStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(requestService.updateRequestStatus(id, requestStatus, deliveryProofUrl, deliveryProofNote));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid status: " + status, "INVALID_STATUS"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage(), "REQUEST_NOT_FOUND"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred while updating request status", "INTERNAL_ERROR"));
        }
    }
}

