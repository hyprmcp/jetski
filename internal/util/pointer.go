package util

func PtrTo[T any](value T) *T {
	return &value
}

func PtrCopy[T any](ptr *T) *T {
	if ptr == nil {
		return nil
	}
	v := *ptr
	return &v
}

// PtrEq returns true iff both a and b are nil pointers or their dereferenced values are equal
func PtrEq[T comparable](a, b *T) bool {
	return (a == nil && b == nil) || (a != nil && b != nil && *a == *b)
}
