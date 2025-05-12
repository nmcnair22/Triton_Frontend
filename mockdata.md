Below are four mock JSON payloads—one for each view (Global Dashboard, Project Page, Job Page, Visit Page)—all populated with values pulled from your attached dataset.json .

---

### 1. Global Dashboard

```json
{
  "summary": {
    "totalProjects": 1,
    "totalJobs": 1,
    "totalVisits": 11,
    "openIssues": 11,
    "avgCompletionPct": 27.0,
    "atRiskCount": 2
  },
  "projectList": [
    {
      "projectId": "3912",
      "name": "Network Installation – Hagerstown, MD",
      "customer": "Flynn",
      "siteCount": 1,
      "completionPct": 27.0,
      "atRiskScore": 62,
      "trend": "steady"
    }
  ],
  "globalTrends": [
    { "date": "2025-02-04", "projectsCompleted": 0, "issuesOpened": 3, "visitsScheduled": 1 },
    { "date": "2025-05-12", "projectsCompleted": 1, "issuesOpened": 12, "visitsScheduled": 1 }
  ],
  "alerts": [
    {
      "alertId": "A1",
      "type": "visitRevisitNeeded",
      "visitId": "VG1",
      "jobId": "6d815ec56dfb85e2182e01471c31e486",
      "message": "Revisit indicated for visit VG1",
      "createdAt": "2025-02-04T08:27:00Z"
    },
    {
      "alertId": "A2",
      "type": "issueHighImpact",
      "issue": "Site Not Ready",
      "jobId": "6d815ec56dfb85e2182e01471c31e486",
      "message": "Site readiness blocking multiple visits",
      "createdAt": "2025-02-04T08:43:59Z"
    }
  ]
}
```

---

### 2. Project Page `/dashboard/projects/3912`

```json
{
  "project": {
    "projectId": "3912",
    "name": "Network Installation – Hagerstown, MD",
    "customer": "Flynn",
    "siteCount": 1,
    "completedSites": 1,
    "inProgressSites": 0,
    "notStartedSites": 0,
    "completionPct": 27.0,
    "trend": "steady"
  },
  "kpis": {
    "visitsCompleted": 3,
    "visitsScheduled": 11,
    "totalVisits": 11,
    "issuesOpen": 11,
    "issuesHighImpact": 2,
    "totalIssues": 12,
    "last24h": {
      "newIssues": 0,
      "completedVisits": 0,
      "scheduledVisits": 1
    }
  },
  "sitesNeedingAttention": [
    {
      "jobId": "6d815ec56dfb85e2182e01471c31e486",
      "location": "Hagerstown, MD",
      "status": "In Progress",
      "openIssues": 11,
      "highImpact": 2,
      "visitsCompleted": 3,
      "visitsTotal": 11,
      "scheduled": 1,
      "completionPct": 27
    }
  ],
  "priorityIssues": [
    {
      "issueId": "ISS-1001",
      "impact": "High",
      "status": "Open",
      "ageDays": 97,
      "title": "Site Not Ready",
      "description": "Multiple visits impacted by site readiness issues",
      "siteJobId": "6d815ec56dfb85e2182e01471c31e486",
      "visitIds": ["VG1","VG2","VG3"],
      "assignedTo": "Joel"
    }
  ],
  "projectTrends": [
    { "date": "2025-02-04", "completionPct": 27, "issuesCount": 3, "visitsCount": 3 },
    { "date": "2025-05-12", "completionPct": 27, "issuesCount": 12, "visitsCount": 11 }
  ],
  "issueAnalysis": {
    "byType": [
      { "type": "Site Not Ready", "count": 5 },
      { "type": "Technical Issue", "count": 1 }
    ],
    "bySiteStatus": [
      { "status": "Completed", "count": 1 },
      { "status": "In Progress", "count": 1 }
    ]
  }
}
```

---

### 3. Job Page `/dashboard/projects/3912/jobs/6d815ec56dfb85e2182e01471c31e486`

```json
{
  "job": {
    "jobId": "6d815ec56dfb85e2182e01471c31e486",
    "customer": "Flynn",
    "location": "Hagerstown, MD",
    "status": "In Progress",
    "completionPct": 27,
    "totalVisits": 11,
    "revisitCount": 7,
    "firstDate": "2025-02-04",
    "lastDate": "2025-05-12",
    "workSummary": "Network service with 3 completed visits and 5 attempted visits"
  },
  "visits": [
    {
      "visitId": "VG1",
      "phaseName": "Site Survey",
      "visitDate": "2025-02-04",
      "status": "Completed",
      "timeOnSiteMin": 27,
      "revisitNeeded": false
    },
    {
      "visitId": "VG2",
      "phaseName": "Phase 1",
      "visitDate": "2025-02-11",
      "status": "Failed - Snow Storm",
      "timeOnSiteMin": 0,
      "revisitNeeded": true
    },
    {
      "visitId": "VG3",
      "phaseName": "P2",
      "visitDate": "2025-02-12",
      "status": "Cancelled - CIS",
      "timeOnSiteMin": 0,
      "revisitNeeded": true
    }
  ]
}
```

---

### 4. Visit Page `/dashboard/projects/3912/jobs/…/visits/VG1`

```json
{
  "visit": {
    "visitId": "VG1",
    "jobId": "6d815ec56dfb85e2182e01471c31e486",
    "phaseName": "Site Survey",
    "visitDate": "2025-02-04",
    "status": "Completed",
    "timeIn": "08:00:00",
    "timeOut": "08:27:00",
    "timeOnSiteMin": 27,
    "revisitNeeded": false,
    "workSummary": "Site survey completed successfully."
  },
  "technicians": [
    { "technicianId":  null, "name": "Joel", "hoursWorked": 0.45, "roles": ["Contractor"] }
  ],
  "tasks": [
    "Site Survey"
  ],
  "issues": [
    {
      "visitIssueId": null,
      "description": "Technician was unable to locate the ISP circuit.",
      "status": "Unresolved",
      "mitigation": "Further investigation may be required.",
      "resolutionAttempts": [
        { "attemptDescription": "Checked for ISP circuit on site.", "outcome": "Unsuccessful" }
      ]
    }
  ],
  "timelineEvents": [
    { "timestamp": "2025-02-04T08:43:59Z", "event": "Checked in with MOD, Tim" },
    { "timestamp": "2025-02-04T08:43:59Z", "event": "Completed site survey" }
  ],
  "materialsUsed": [],
  "keyInteractions": [
    { "interactionType": "Check-in", "details": "Checked in with MOD, Tim", "impact": "Allowed access to site" }
  ]
}
```

All values here are pulled from your attached dataset.json .
