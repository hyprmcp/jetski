package analytics

import (
	"slices"

	"github.com/hyprmcp/jetski/internal/types"
)

// calculateRecentSessions computes recent session data
func calculateRecentSessions(logs []types.MCPServerLog) types.RecentSessions {
	sessionData := make(map[string]*sessionInfo)

	for _, log := range logs {
		sessionID := getNormalizedSessionID(log)

		if sessionID == nil {
			continue
		}

		session, exists := sessionData[*sessionID]
		if !exists {
			session = &sessionInfo{
				sessionID:      *sessionID,
				firstStartedAt: log.StartedAt,
				lastStartedAt:  log.StartedAt,
				lastDuration:   log.Duration,
			}
			sessionData[*sessionID] = session
		} else if session.lastStartedAt.Add(session.lastDuration).Before(log.StartedAt.Add(log.Duration)) {
			session.lastStartedAt = log.StartedAt
			session.lastDuration = log.Duration
		}

		session.calls++

		if log.IsError() {
			session.errors++
		}

		if log.UserAgent != nil {
			session.userAgent = *log.UserAgent
		}

		toolName := extractToolName(log.MCPRequest)
		if toolName != "" {
			session.lastToolCall = toolName
		}
	}

	// Convert to required format and get recent sessions
	sessions := make([]types.RecentSession, 0)
	for _, session := range sessionData {
		sessions = append(sessions, types.RecentSession{
			SessionID:    session.sessionID,
			User:         getNormalizedUserAgent(session.userAgent),
			Calls:        session.calls,
			Errors:       session.errors,
			LastToolCall: session.lastToolCall,
			StartedAt:    session.firstStartedAt,
			EndedAt:      session.lastStartedAt.Add(session.lastDuration),
		})
	}

	slices.SortFunc(sessions, func(a, b types.RecentSession) int {
		return int(b.EndedAt.Sub(a.EndedAt).Milliseconds())
	})

	return types.RecentSessions{
		Sessions: sessions,
	}
}
