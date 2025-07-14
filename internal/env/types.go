package env

import (
	"fmt"
)

type SamplerType string

const (
	SamplerAlwaysOn                SamplerType = "always_on"
	SamplerAlwaysOff               SamplerType = "always_off"
	SamplerTraceIDRatio            SamplerType = "traceidratio"
	SamplerParentBasedAlwaysOn     SamplerType = "parentbased_always_on"
	SamplerParsedBasedAlwaysOff    SamplerType = "parentbased_always_off"
	SamplerParentBasedTraceIDRatio SamplerType = "parentbased_traceidratio"
)

func parseSamplerType(value string) (SamplerType, error) {
	switch value {
	case string(SamplerAlwaysOn),
		string(SamplerAlwaysOff),
		string(SamplerTraceIDRatio),
		string(SamplerParentBasedAlwaysOn),
		string(SamplerParsedBasedAlwaysOff),
		string(SamplerParentBasedTraceIDRatio):

		return SamplerType(value), nil
	default:
		return "", fmt.Errorf("invalid SamplerType: %v", value)
	}
}

type SamplerConfig struct {
	Sampler SamplerType
	Arg     float64
}
