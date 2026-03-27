package com.bitesharing.repository;

import com.bitesharing.model.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByPointsRequiredLessThanEqual(Integer points);
}

