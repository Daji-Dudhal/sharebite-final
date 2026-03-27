package com.bitesharing.controller;

import com.bitesharing.model.PointsHistory;
import com.bitesharing.model.UserBadge;
import com.bitesharing.model.UserPoints;
import com.bitesharing.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping("/points/{userId}")
    public ResponseEntity<UserPoints> getUserPoints(@PathVariable Long userId) {
        return ResponseEntity.ok(gamificationService.getUserPoints(userId));
    }

    @GetMapping("/badges/{userId}")
    public ResponseEntity<List<UserBadge>> getUserBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(gamificationService.getUserBadges(userId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserPoints>> getLeaderboard() {
        return ResponseEntity.ok(gamificationService.getLeaderboard());
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<PointsHistory>> getPointsHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(gamificationService.getPointsHistory(userId));
    }
}

