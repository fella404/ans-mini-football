export const PAGE_DEFAULT = 1;
export const LIMIT_DEFAULT = 10;
export const LIMIT_VALUES = [10, 20, 50];

// page/limit dari URL; nilai asing jatuh ke default, bukan error.
export const parsePaging = (params) => {
  const page = Number.parseInt(params.get("page") ?? "", 10);
  const limit = Number(params.get("limit"));
  return {
    page: Number.isFinite(page) && page > 0 ? page : PAGE_DEFAULT,
    limit: LIMIT_VALUES.includes(limit) ? limit : LIMIT_DEFAULT,
  };
};
