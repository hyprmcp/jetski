package env

import "gopkg.in/yaml.v3"

func parseYAMLMap(input string) (result map[string]string, err error) {
	err = yaml.Unmarshal([]byte(input), &result)
	return
}
