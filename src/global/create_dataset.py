import wikipedia
import bs4
import json
import sys


def main():
    page = wikipedia.page("List_of_suicide_crisis_lines")
    html = bs4.BeautifulSoup(page.html(), "html.parser")

    dataset = {}
    for row in html.find("tbody").findAll("tr")[1:]:
        links = row.find_all("a")
        country = ""
        for link in links:
            href = link.get("href")
            text = link.text
            if href != f"/wiki/{text}":
                continue
            if ".svg" in href:
                continue
            country = text
            break

        country_data = {
            'raw_html': "".join([str(x) for x in row.find('td').contents]).strip(),
            'parsed_batches': [],
        }
        country_details = row.find_all("li")
        for each in country_details.find('li', {"class": None}, recursive=False):
            country_data['parsed_batches'].append(
                # {"phones": phone_numbers, "description": phone_batch.text}
                {"description": each.text}
            )
        dataset[country] = country_data

    json.dump(dataset, sys.stdout, indent=4)


if __name__ == "__main__":
    main()
