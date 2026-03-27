package com.bitesharing.controller;

import com.bitesharing.model.DistributionProof;
import com.bitesharing.repository.DistributionProofRepository;
import com.bitesharing.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/distribution")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class DistributionProofController {

    private final DistributionProofRepository distributionProofRepository;
    private final RequestRepository requestRepository;

    @PostMapping
    public ResponseEntity<DistributionProof> createProof(
            @RequestParam Long requestId,
            @RequestParam String photoUrl,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Integer distributedToCount) {
        try {
            DistributionProof proof = new DistributionProof();
            proof.setRequest(requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Request not found")));
            proof.setPhotoUrl(photoUrl);
            proof.setDescription(description);
            proof.setDistributedToCount(distributedToCount);

            return ResponseEntity.ok(distributionProofRepository.save(proof));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<DistributionProof>> getProofsByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(distributionProofRepository.findByRequestId(requestId));
    }
}

