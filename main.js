document.addEventListener("DOMContentLoaded", function() {
    document.querySelector("img.clouds").onclick = function () {
        document.querySelector("div.clouds").style.display = 'block';
        document.querySelector("div.radar").style.display = 'none';
    };
    document.querySelector("img.radar").onclick = function () {
        document.querySelector("div.clouds").style.display = 'none';
        document.querySelector("div.radar").style.display = 'block';
    };
});

const col = function (value, type = 'td') {
    const column = document.createElement(type);
    column.appendChild(document.createTextNode(value));
    return column;
};

const lastValue = function (data, unit) {
    const values = data[unit];
    if (!values) {
        return '';
    }

    const timepoints = Object.keys(values);
    const lastTime = timepoints[timepoints.length - 1];
    return values[lastTime];
};

const salzburgWtr = function (data) {
    const table = document.getElementById('salzburgWtr');

    const places = Object.keys(data);
    const types = places.reduce(function (acc, place) {
        Object.keys(data[place]).forEach(t => acc.add(t));
        return acc;
    }, new Set());

    const heading = document.createElement("tr");
    heading.appendChild(col('Messort', 'th'));
    types.forEach(type => {
        heading.appendChild(col(type, 'th'));
    });
    table.appendChild(heading);

    places.forEach(function (place) {
        const measurements = data[place];
        const row = document.createElement("tr");
        row.appendChild(col(place, 'td'));
        types.forEach(type => {
            row.appendChild(col(lastValue(measurements, type)));
        });
        table.appendChild(row);
    });
};