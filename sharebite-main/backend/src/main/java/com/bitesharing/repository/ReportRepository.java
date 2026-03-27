package com.bitesharing.repository;

import com.bitesharing.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReportType(Report.ReportType reportType);
    List<Report> findByGeneratedById(Long generatedById);
}

