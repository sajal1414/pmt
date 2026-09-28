from sqlalchemy import or_

ISNULL_SENTINEL = "__isnull__"


def parse_pagination(args, default_limit=50, max_limit=200):
    try:
        limit = min(int(args.get("limit", default_limit)), max_limit)
    except ValueError:
        limit = default_limit
    try:
        offset = max(int(args.get("offset", 0)), 0)
    except ValueError:
        offset = 0
    return limit, offset


def parse_sort(query, model, args, sortable_columns, default_sort="id"):
    sort_by = args.get("sort_by", default_sort)
    if sort_by not in sortable_columns:
        sort_by = default_sort
    column = getattr(model, sort_by)
    if args.get("sort_order", "asc").lower() == "desc":
        column = column.desc()
    return query.order_by(column)


def apply_filters(query, model, args, filterable_columns, range_columns=frozenset(), search_columns=None):
    """Whitelisted equality/range/isnull filters + a simple ILIKE `search=` across search_columns."""
    for col_name in filterable_columns:
        if col_name not in args:
            continue
        value = args.get(col_name)
        column = getattr(model, col_name)
        if value == ISNULL_SENTINEL:
            query = query.filter(column.is_(None))
        else:
            query = query.filter(column == value)

    for col_name in range_columns:
        column = getattr(model, col_name)
        from_value = args.get(f"{col_name}_from")
        to_value = args.get(f"{col_name}_to")
        if from_value:
            query = query.filter(column >= from_value)
        if to_value:
            query = query.filter(column <= to_value)

    search_term = args.get("search")
    if search_term and search_columns:
        pattern = f"%{search_term}%"
        query = query.filter(or_(*[getattr(model, c).ilike(pattern) for c in search_columns]))

    return query
