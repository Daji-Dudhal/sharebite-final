package com.bitesharing.service;

import com.bitesharing.model.*;
import com.bitesharing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserPointsRepository userPointsRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final PointsHistoryRepository pointsHistoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public void addPoints(Long userId, Integer points, String reason, PointsHistory.RelatedEntityType entityType, Long entityId) {
        UserPoints userPoints = userPointsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    UserPoints newPoints = new UserPoints();
                    newPoints.setUser(user);
                    newPoints.setTotalPoints(0);
                    newPoints.setLevel(1);
                    return newPoints;
                });

        userPoints.setTotalPoints(userPoints.getTotalPoints() + points);
        userPoints.setLevel(calculateLevel(userPoints.getTotalPoints()));
        userPointsRepository.save(userPoints);

        // Save points history
        PointsHistory history = new PointsHistory();
        history.setUser(userPoints.getUser());
        history.setPoints(points);
        history.setReason(reason);
        history.setRelatedEntityType(entityType);
        history.setRelatedEntityId(entityId);
        pointsHistoryRepository.save(history);

        // Check for new badges
        checkAndAwardBadges(userId, userPoints.getTotalPoints());
    }

    private Integer calculateLevel(Integer totalPoints) {
        return (totalPoints / 100) + 1;
    }

    @Transactional
    public void checkAndAwardBadges(Long userId, Integer totalPoints) {
        List<Badge> availableBadges = badgeRepository.findByPointsRequiredLessThanEqual(totalPoints);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        for (Badge badge : availableBadges) {
            if (!userBadgeRepository.existsByUserIdAndBadgeId(userId, badge.getId())) {
                UserBadge userBadge = new UserBadge();
                userBadge.setUser(user);
                userBadge.setBadge(badge);
                userBadgeRepository.save(userBadge);

                // Add points for earning badge
                addPoints(userId, 50, "Earned badge: " + badge.getName(),
                        PointsHistory.RelatedEntityType.BADGE, badge.getId());
            }
        }
    }

    public UserPoints getUserPoints(Long userId) {
        return userPointsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    UserPoints newPoints = new UserPoints();
                    newPoints.setUser(user);
                    newPoints.setTotalPoints(0);
                    newPoints.setLevel(1);
                    return userPointsRepository.save(newPoints);
                });
    }

    public List<UserBadge> getUserBadges(Long userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    public List<UserPoints> getLeaderboard() {
        return userPointsRepository.findAllByOrderByTotalPointsDesc();
    }

    public List<PointsHistory> getPointsHistory(Long userId) {
        return pointsHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}

