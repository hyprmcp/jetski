package lists

import (
	"errors"
	"github.com/jetski-sh/jetski/internal/util"
	"net/http"
	"slices"
	"strconv"
	"strings"
)

var (
	ErrorInvalidCountParameter     = errors.New("invalid parameter: count")
	ErrorInvalidPageParameter      = errors.New("invalid parameter: page")
	ErrorInvalidSortOrderParameter = errors.New("invalid parameter: sortOrder")
	ErrorInvalidSortByParameter    = errors.New("invalid parameter: sortBy")
)

type Pagination struct {
	Count int
	Page  int
}

type SortOrder string

const SortOrderAsc SortOrder = "asc"
const SortOrderDesc SortOrder = "desc"

type Sorting struct {
	SortBy    string
	SortOrder SortOrder
}

type ListResponse struct {
	Pagination Pagination `json:"pagination"`
	Sorting    Sorting    `json:"sorting"`
	Items      any        `json:"items"`
}

func ParsePaginationOrDefault(r *http.Request, fallback Pagination) (Pagination, error) {
	pagination := Pagination{
		Count: fallback.Count,
		Page:  fallback.Page,
	}
	if countStr := r.URL.Query().Get("count"); countStr != "" {
		if c, err := strconv.Atoi(countStr); err == nil && c >= 0 {
			pagination.Count = c
		} else {
			return Pagination{}, ErrorInvalidCountParameter
		}
	}
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p >= 0 {
			pagination.Page = p
		} else {
			return Pagination{}, ErrorInvalidPageParameter
		}
	}
	return pagination, nil
}

type SortingOptions struct {
	DefaultSortBy    string
	DefaultSortOrder SortOrder
	AllowedSortBy    []string
}

func ParseSortingOrDefault(r *http.Request, options SortingOptions) Sorting {
	sorting := Sorting{
		SortBy:    options.DefaultSortBy,
		SortOrder: options.DefaultSortOrder,
	}
	if sortBy := r.URL.Query().Get("sortBy"); sortBy != "" {
		if slices.Contains(options.AllowedSortBy, sortBy) {
			sorting.SortBy = sortBy
		}
	}
	if sortOrder := parseSortOrder(r); sortOrder != nil {
		sorting.SortOrder = *sortOrder
	}
	return sorting
}

func parseSortOrder(r *http.Request) *SortOrder {
	if sortOrderRaw := r.URL.Query().Get("sortOrder"); sortOrderRaw != "" {
		sortOrder := strings.TrimSpace(strings.ToLower(sortOrderRaw))
		if sortOrder == string(SortOrderDesc) {
			return util.PtrTo(SortOrderDesc)
		} else if sortOrder == string(SortOrderAsc) {
			return util.PtrTo(SortOrderAsc)
		}
	}
	return nil
}
