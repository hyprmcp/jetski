// copy+pasted from the mcp-proxy project. please don't forget to mirror any changes there
package gatewayconfig

import (
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Host          *URL           `yaml:"host" json:"host"`
	Authorization Authorization  `yaml:"authorization" json:"authorization"`
	DexGRPCClient *DexGRPCClient `yaml:"dexGRPCClient,omitempty" json:"dexGRPCClient,omitempty"`
	Proxy         []Proxy        `yaml:"proxy" json:"proxy"`
}

type Authorization struct {
	Server                     string `yaml:"server" json:"server"`
	ServerMetadataProxyEnabled bool   `yaml:"serverMetadataProxyEnabled" json:"serverMetadataProxyEnabled"`
	AuthorizationProxyEnabled  bool   `yaml:"authorizationProxyEnabled" json:"authorizationProxyEnabled"`
	// DynamicClientRegistrationEnabled
	//
	// Deprecated: use DynamicClientRegistration instead
	DynamicClientRegistrationEnabled *bool                      `yaml:"dynamicClientRegistrationEnabled" json:"dynamicClientRegistrationEnabled"`
	DynamicClientRegistration        *DynamicClientRegistration `yaml:"dynamicClientRegistration" json:"dynamicClientRegistration"`
}

func (c *Authorization) GetDynamicClientRegistration() DynamicClientRegistration {
	if c.DynamicClientRegistration != nil {
		return *c.DynamicClientRegistration
	} else if c.DynamicClientRegistrationEnabled != nil && *c.DynamicClientRegistrationEnabled {
		return DynamicClientRegistration{true, true}
	} else {
		return DynamicClientRegistration{false, false}
	}

}

type DynamicClientRegistration struct {
	Enabled      bool `yaml:"enabled" json:"enabled"`
	PublicClient bool `yaml:"publicClient" json:"publicClient"`
}

type DexGRPCClient struct {
	Addr string `yaml:"addr"`
}

type Proxy struct {
	Path           string              `yaml:"path" json:"path"`
	Http           *ProxyHttp          `yaml:"http,omitempty" json:"http,omitempty"`
	Authentication ProxyAuthentication `yaml:"authentication" json:"authentication"`
	Telemetry      ProxyTelemetry      `yaml:"telemetry" json:"telemetry"`
	Webhook        *Webhook            `yaml:"webhook,omitempty" json:"webhook,omitempty"`
}

type ProxyHttp struct {
	Url *URL `yaml:"url" json:"url"`
}

type ProxyAuthentication struct {
	Enabled bool `yaml:"enabled" json:"enabled"`
}

type ProxyTelemetry struct {
	Enabled bool `yaml:"enabled" json:"enabled"`
}

type Webhook struct {
	Method string `yaml:"method,omitempty" json:"method,omitempty"`
	Url    URL    `yaml:"url" json:"url"`
}

type URL url.URL

func (p *URL) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	} else if parsed, err := url.Parse(s); err != nil {
		return err
	} else {
		*p = URL(*parsed)
		return nil
	}
}

func (p URL) MarshalJSON() ([]byte, error) {
	return json.Marshal(p.String())
}

func (p *URL) UnmarshalYAML(value *yaml.Node) error {
	if parsed, err := url.Parse(value.Value); err != nil {
		return err
	} else {
		*p = URL(*parsed)
		return nil
	}
}

func (p URL) MarshalYAML() (any, error) {
	return p.String(), nil
}

func (p *URL) String() string {
	return (*url.URL)(p).String()
}

func ParseFile(fileName string) (*Config, error) {
	if file, err := os.Open(fileName); err != nil {
		return nil, fmt.Errorf("failed to open config file %s: %w", fileName, err)
	} else {
		defer func() { _ = file.Close() }()
		return Parse(file)
	}
}

func Parse(r io.Reader) (*Config, error) {
	var config Config
	if err := yaml.NewDecoder(r).Decode(&config); err != nil {
		return nil, fmt.Errorf("failed to decode config: %w", err)
	}
	return &config, config.Validate()
}

func (c *Config) YAMLString() (string, error) {
	if data, err := yaml.Marshal(c); err != nil {
		return "", err
	} else {
		return string(data), nil
	}
}

func (c *Config) Validate() error {
	if c.Host == nil {
		return fmt.Errorf("host is required")
	}

	if c.Authorization.Server == "" {
		return fmt.Errorf("authorization server is required")
	}

	if c.Authorization.GetDynamicClientRegistration().Enabled {
		if !c.Authorization.ServerMetadataProxyEnabled {
			return fmt.Errorf("serverMetadataProxyEnabled must be true when dynamicClientRegistrationEnabled is true")
		}

		if c.DexGRPCClient == nil || c.DexGRPCClient.Addr == "" {
			return fmt.Errorf("dexGRPCClient is required when dynamicClientRegistrationEnabled is true")
		}
	}

	return nil
}
