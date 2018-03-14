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

const translate = function (label) {
    const dict = {
        'Lufttemperatur [GradC]': 'temp',
        'rel. Luftfeuchte [%]': 'humidity',
        'Windgeschwindigkeit [m/s]': 'wind',
        'Windrichtung [Grad]': 'wind-dir',
        'Windspitze [m/s]': 'wind-max',
        'Luftdruck [hPa]': 'pressure',
        'Sonnenscheindauer [min]': 'sun'
    };
    return dict[label.replace(/\s{2,}/g,' ').trim()] || label;
};

const colTransform = function (value, type) {
    transformations = {
        'temp': () => {
            const temp = document.createElement('span');
            temp.appendChild(document.createTextNode(value + '°'));
            if(value.startsWith('-')) {
                temp.classList.add('negative');
            }
            return temp;

        },
        'wind-dir': () => {
            const arrow = document.createElement('span');
            arrow.appendChild(document.createTextNode('↑'));
            arrow.setAttribute('title', value);
            arrow.style.transform = 'rotate(' + value + 'deg)';
            return arrow;
        },
        'humidity': () => {
            const hum = document.createElement('span');
            hum.appendChild(document.createTextNode(value + '%'));
            hum.style.background = 'linear-gradient(to left, rgba(85, 252, 246, 0.4) '+value+'%, #fff '+value+'%';
            return hum;
        }
    };
    const transformation = transformations[type];
    if(value && transformation) {
        return transformation();
    } else {
        return document.createTextNode(value);
    }

};

const col = function (value, type) {
    const column = document.createElement('td');
    if(type) {
        console.log('type', type);
        column.appendChild(colTransform(value, type));
        column.classList.add(type);
        column.classList.add('type');
    } else {
        column.appendChild(document.createTextNode(value));
    }
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

    document.querySelector('.spinner').style.display='none';

    const table = document.getElementById('salzburgWtr');

    const places = Object.keys(data);
    const types = places.reduce(function (acc, place) {
        Object.keys(data[place]).forEach(t => acc.add(t));
        return acc;
    }, new Set());

    const heading = document.createElement("tr");
    heading.classList.add('header');
    heading.appendChild(col(''));
    types.forEach(type => {
        heading.appendChild(col(translate(type)));
    });
    table.appendChild(heading);

    places.forEach(function (place) {
        const measurements = data[place];
        const row = document.createElement("tr");
        row.appendChild(col(place));
        types.forEach(type => {
            row.appendChild(col(lastValue(measurements, type), translate(type)));
        });
        table.appendChild(row);
    });
};
