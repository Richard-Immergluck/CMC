export const getPaginationPageItems = ({ page, pageCount }) => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const pages = new Set([1, pageCount])

  if (page <= 4) {
    for (let pageNumber = 2; pageNumber <= 5; pageNumber += 1) {
      pages.add(pageNumber)
    }
  } else if (page >= pageCount - 3) {
    for (let pageNumber = pageCount - 4; pageNumber < pageCount; pageNumber += 1) {
      pages.add(pageNumber)
    }
  } else {
    pages.add(page - 1)
    pages.add(page)
    pages.add(page + 1)
  }

  const sortedPages = [...pages].sort((first, second) => first - second)
  const items = []

  sortedPages.forEach((pageNumber, index) => {
    const previousPageNumber = sortedPages[index - 1]

    if (previousPageNumber && pageNumber - previousPageNumber > 1) {
      if (pageNumber - previousPageNumber === 2) {
        items.push(previousPageNumber + 1)
      } else {
        items.push(`ellipsis-${previousPageNumber}-${pageNumber}`)
      }
    }

    items.push(pageNumber)
  })

  return items
}
