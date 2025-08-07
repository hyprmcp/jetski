package mailtemplates

import (
	"embed"
	"github.com/jetski-sh/jetski/internal/types"
	"html/template"
	"io/fs"
	"net/url"
	"path"
)

var (
	//go:embed templates/*
	embeddedFS embed.FS

	templates *template.Template
	funcMap   = template.FuncMap{
		"QueryEscape":    url.QueryEscape,
		"UnsafeHTMLAttr": func(value string) template.HTMLAttr { return template.HTMLAttr(value) },
		"UnsafeHTML":     func(value string) template.HTML { return template.HTML(value) },
		"UnsafeURL":      func(value string) template.URL { return template.URL(value) },
	}
)

func init() {
	if fsys, err := fs.Sub(embeddedFS, "templates"); err != nil {
		panic(err)
	} else {
		templates = template.Must(parse(fsys, "*.html", "fragments/*.html"))
	}
}

func parse(fsys fs.FS, patterns ...string) (*template.Template, error) {
	t := template.New("").Funcs(funcMap)
	for _, p := range patterns {
		if files, err := fs.Glob(fsys, p); err != nil {
			return nil, err
		} else {
			for _, file := range files {
				// funcMap must be present during parsing *and* execution
				if ft, err := template.New("").Funcs(funcMap).ParseFS(fsys, file); err != nil {
					return nil, err
				} else if _, err := t.AddParseTree(file, ft.Lookup(path.Base(file)).Tree); err != nil {
					return nil, err
				}
			}
		}
	}
	return t, nil
}

func InviteUser(
	userAccount types.UserAccount,
	organization types.Organization,
) (*template.Template, any) {
	return templates.Lookup("invite-user.html"),
		map[string]any{
			"UserAccount":  userAccount,
			"Organization": organization,
		}
}
