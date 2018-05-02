import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {
    div,
    span,
    nav,
    a,
    img,
    i,
    h2,
    p,
    form,
    label,
    input,
    textarea,
} from '@cycle/dom';

export function ConfigModal({ fractal, DOM, props }) {
    const siteFields$ = xs
        .merge(
            DOM.select('#update-site input').events('input'),
            DOM.select('#update-site textarea').events('input')
        )
        .map(event => ({ [event.target.name]: event.target.value }));

    const navFields$ = DOM.select('#links input')
        .events('input')
        .map(event => {
            const el = event.target;
            return {
                id: Number(el.dataset.id),
                fields: { [el.name]: el.value },
            };
        });

    const save$ = DOM.select('form#update-site')
        .events('submit', { preventDefault: true })
        .mapTo(true);

    const reducers$ = xs.merge(
        siteFields$.map(changes => state => ({
            ...state,
            config: {
                dirty: true,
                site: {
                    ...state.config.site,
                    ...changes,
                },
            },
        })),
        navFields$.map(changes => {
            const id = changes.id;
            return state => {
                const site = state.config.site;
                const nav =
                    id >= site.nav.length
                        ? site.nav.concat({
                              name: '',
                              href: '',
                              ...changes.fields,
                          })
                        : site.nav.map(
                              (link, k) =>
                                  k === id
                                      ? { ...link, ...changes.fields }
                                      : link
                          );

                return {
                    ...state,
                    config: {
                        dirty: true,
                        site: {
                            ...state.config.site,
                            nav,
                        },
                    },
                };
            };
        })
    );

    const http$ = save$
        .compose(sampleCombine(props.authToken$, fractal.state$))
        .map(params => {
            const [withAuth, state] = params.slice(1);
            return {
                method: 'PUT',
                type: 'application/json',
                url: `${Anzu.layer}config`,
                category: 'config',
                send: {
                    section: 'site',
                    changes: {
                        name: state.config.site.name,
                        description: state.config.site.description,
                        nav: state.config.site.nav,
                    },
                },
                headers: withAuth({}),
            };
        });

    /**
     * View computation.
     */
    const vdom$ = fractal.state$.map(state => {
        const { config } = state;
        const dirty = config.dirty || false;
        const site = config.site || {};
        const links = site.nav.concat({ name: '', href: '' });

        return div('.modal-container.config', { style: { width: '640px' } }, [
            div('.flex', [
                nav([
                    a(
                        img('.w3', {
                            attrs: { src: '/images/anzu.svg', alt: 'Anzu' },
                        })
                    ),
                    a('.active', [i('.icon-cog.mr1'), 'General']),
                    a([i('.icon-th-list-outline.mr1'), 'Categorias']),
                    a([i('.icon-lock-open.mr1'), 'Permisos']),
                    a([i('.icon-picture-outline.mr1'), 'Diseño']),
                ]),
                div('.flex-auto', [
                    form({ attrs: { id: 'update-site' } }, [
                        div('.flex.items-center.header', [
                            h2('.flex-auto', 'General'),
                            dirty !== false
                                ? span(
                                      input('.btn.btn-primary.btn-block', {
                                          attrs: {
                                              type: 'submit',
                                              value: 'Guardar cambios',
                                          },
                                      })
                                  )
                                : null,
                        ]),
                        div('.form-group', [
                            label('.b.form-label', 'Nombre del sitio'),
                            input('.form-input', {
                                attrs: {
                                    name: 'name',
                                    type: 'text',
                                    placeholder: 'Ej. Comunidad de Anzu',
                                    required: true,
                                    value: site.name,
                                },
                            }),
                            p(
                                '.form-input-hint',
                                'Mostrado alrededor del sitio, el nombre de tu comunidad.'
                            ),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', 'Descripción del sitio'),
                            textarea('.form-input', {
                                props: {
                                    value: site.description,
                                },
                                attrs: {
                                    name: 'description',
                                    placeholder: '...',
                                    rows: 3,
                                },
                            }),
                            p(
                                '.form-input-hint',
                                'Para metadatos, resultados de busqueda y dar a conocer tu comunidad.'
                            ),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', 'Dirección del sitio'),
                            input('.form-input', {
                                attrs: {
                                    name: 'url',
                                    type: 'text',
                                    placeholder:
                                        'Ej. https://comunidad.anzu.io',
                                    required: true,
                                    value: site.url,
                                },
                            }),
                            p(
                                '.form-input-hint.lh-copy',
                                'URL absoluta donde vive la instalación de Anzu. Utilizar una dirección no accesible puede provocar no poder acceder al sitio.'
                            ),
                        ]),
                    ]),
                    form('.bt.b--light-gray.pt2', { attrs: { id: 'links' } }, [
                        div('.form-group', [
                            label('.b.form-label', 'Menu de navegación'),
                            p(
                                '.form-input-hint',
                                'Mostrado en la parte superior del sitio. (- = +)'
                            ),
                            div(
                                links.map((link, k) => {
                                    return div(
                                        '.input-group.mb2.fade-in',
                                        { key: `link-${k}` },
                                        [
                                            span(
                                                '.input-group-addon',
                                                i('.icon-up-outline')
                                            ),
                                            span(
                                                '.input-group-addon',
                                                i('.icon-down-outline')
                                            ),
                                            input('.form-input', {
                                                dataset: { id: String(k) },
                                                attrs: {
                                                    name: 'name',
                                                    type: 'text',
                                                    placeholder: '...',
                                                    value: link.name,
                                                    required: true,
                                                },
                                            }),
                                            input('.form-input', {
                                                dataset: { id: String(k) },
                                                attrs: {
                                                    name: 'href',
                                                    type: 'text',
                                                    placeholder: '...',
                                                    value: link.href,
                                                    required: true,
                                                },
                                            }),
                                        ]
                                    );
                                })
                            ),
                        ]),
                    ]),
                ]),
            ]),
        ]);
    });

    return {
        DOM: vdom$,
        fractal: reducers$,
        HTTP: http$,
    };
}