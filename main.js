const store = {
    debug: true,
    initializedTime: new Date(),
    state: {
        salzburgWeather: null,
        lawine: null,
        openWeather: {
            name: null,
            main: {
                humidity: null,
                pressure: null,
                temp: null,
            },
            wind: {
                deg: null,
                speed: null
            },
            clouds: {
                all: null,
            },
            sys: null,
            weather: [],
        },
        dict: {
            'Lufttemperatur [GradC]': 'temp',
            'rel. Luftfeuchte [%]': 'humidity',
            'Windgeschwindigkeit [m/s]': 'wind',
            'Windrichtung [Grad]': 'wind-dir',
            'Windspitze [m/s]': 'wind-max',
            'Luftdruck [hPa]': 'pressure',
            'Sonnenscheindauer [min]': 'sun'
        },
        radars: [
            {
                img: 'https://www.austrocontrol.at/jart/met/radar/loop.gif',
                thumb: 'img/radar.png',
                width: '600',
                height: '470'
            },
            {
                img: 'https://www.austrocontrol.at/jart/met/radar/satloop.gif',
                thumb: 'img/clouds.png',
                width: 'width="600',
                height: '450'
            },
            {
                img: () => {
                    const d = new Date();
                    const pad = (val) => ('0' + val).substr(-2);
                    const slug = `${d.getYear() - 100}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
                    return `https://meteoalarm.eu/maps/AT-${slug}-x800.gif`; //format: AT-YYMMDD-x800.gif
                },
                thumb: 'https://warnungen.zamg.at/warnwidget/de/heute/alle/at/',
                thumbStyle: 'clip-path: inset(5px 15px 16px 15px);',
                width: '800',
                height: '451',
                href: 'https://warnungen.zamg.at/html/de/heute/alle/at/'
            },
        ],
        radarVisible: 'https://www.austrocontrol.at/jart/met/radar/loop.gif',
        salzburgWarning: null
    },
    setSalzburgWeather: function (data) {
        store.state.salzburgWeather = data;
    },
    setOpenWeather: function (data) {
        console.log(JSON.stringify(data, null, 2));
        store.state.openWeather = data;
    },
    setLawine: function (data) {
        store.state.lawine = data;
        store.state.radars.push({
            img: data.image,
            thumb: data.image,
            width: '396',
            height: '350'
        })
    },
    setWarnings: function (data) {
        const sbg = data.rss.channel.item.filter(item => item.title === 'Salzburg')[0];

        var el = document.createElement('div');
        el.innerHTML = sbg.description;

        var rows = el.getElementsByTagName('tr');

        const getSection = (row) => {
            const text = row.textContent.trim();
            if (text === 'Today' || text === 'Tomorrow') {
                return text.toLowerCase();
            }
            return null;
        };

        const getImage = (row) => {
            const img = row.getElementsByTagName('img');
            if (img.length > 0) {
                return {
                    src: img[0].getAttribute('src'),
                    alt: img[0].getAttribute('alt'),

                }
            }
            return null;
        };

        const result = {
            'today': [],
            'tomorrow': [],
            link: sbg.link,
            pubDate: sbg.pubDate,
        };

        let section = null;
        for (let i = 0; i < rows.length; i++) {
            const firstRow = rows[i];
            const currentSection = getSection(firstRow);
            if (currentSection) {
                section = currentSection;
                continue;
            }
            i++;
            const secondRow = rows[i];
            const currentImage = getImage(firstRow);

            const timeSpan = firstRow.innerText;
            const description = secondRow.innerText;

            const item = {
                img: currentImage,
                description: description
            };

            if (timeSpan) {
                item.time = timeSpan;
            }
            result[section].push(item);
        }

        console.log(JSON.stringify(result, null, 2));
        store.state.salzburgWarning = result;
    }
};

window.weather = store;

Vue.component('temp', {
    props: ['value'],
    template: '<span v-if="value" v-bind:class="{ negative: value.startsWith(\'-\')}">{{value}}°</span>'
});
Vue.component('humidity', {
    props: ['value'],
    computed: {
        styleObject: function () {
            return {
                background: 'linear-gradient(to left, rgba(85, 252, 246, 0.4) ' + this.value + '%, rgba(0, 0, 0, 0) ' + this.value + '%'
            }
        }
    },
    template: '<span v-if="value" v-bind:style="styleObject">{{value}}%</span>'
});
Vue.component('wind', {
    props: ['value'],
    template: '<span v-if="value">{{value}}</span>'
});
Vue.component('wind-dir', {
    props: ['value'],
    computed: {
        styleObject: function () {
            return {
                transform: 'rotate(' + this.value + 'deg)'
            }
        }
    },
    template: '<span v-if="value" v-bind:title="value" v-bind:style="styleObject">↑</span>'
});
Vue.component('wind-max', {
    props: ['value'],
    template: '<span v-if="value">{{value}}</span>'
});
Vue.component('pressure', {
    props: ['value'],
    template: '<span v-if="value">{{value}}</span>'
});
Vue.component('sun', {
    props: ['value'],
    template: '<span v-if="value">{{value}}</span>'
});
Vue.component('city', {
    props: ['name', 'measurements'],
    computed: {
        lastMeasurement: function () {
            const types = Object.keys(this.measurements);
            const timepoints = Object.keys(this.measurements[types[0]]);
            const lastTime = timepoints[timepoints.length - 1];
            const regex = /(\d{2}).(\d{2}).(\d{4})\s(\d{2}):(\d{2})/g;
            const match = regex.exec(lastTime);
            if (match) {
                // Array [ "10.04.2018 07:00", "10", "04", "2018", "07", "00" ]
                const d = new Date(match[3], match[2] - 1, match[1], match[4], match[5], 0, 0);
                const tzCorrection = (Math.abs(d.getTimezoneOffset()) - 60) * 60000;
                return new Date(d.getTime() + tzCorrection);
            } else {
                throw new Error('Failed to parse date:' + lastTime);
            }
        },
        minutesDiff: function () {
            return Math.ceil((new Date().getTime() - this.lastMeasurement.getTime()) / 60000);
        },
        isOutdated: function () {
            return this.minutesDiff > 90;
        }
    },
    template: '<span>{{name}} <span v-if="isOutdated" v-bind:title="\'outdated, last update: \' + lastMeasurement.toLocaleString()">⛔</span></span>'
});

Vue.component('timing', {
    props: ['measurements'],

    template: '<span v-if="isOutdated">{{lastMeasurement.toLocaleTimeString()}}</span>'
});

const app = new Vue({
    el: '#container',
    data: store.state,
    computed: {
        salzburgHeaders: function () {
            const places = Object.keys(this.salzburgWeather);
            const result = places.reduce((acc, place) => {
                Object.keys(this.salzburgWeather[place]).forEach(t => acc.add(t));
                return acc;
            }, new Set());
            return Array.from(result);
        },
        sunrise: function () {
            if (!this.openWeather.sys) {
                return null;
            }
            return this.timestampToTime(this.openWeather.sys.sunrise);
        },
        sunset: function () {
            if (!this.openWeather.sys) {
                return null;
            }
            return this.timestampToTime(this.openWeather.sys.sunset);
        },
        dayLength: function () {
            if (!this.openWeather.sys) {
                return null;
            }
            var diffMs = (new Date(this.openWeather.sys.sunset * 1000) - new Date(this.openWeather.sys.sunrise * 1000)); // milliseconds between now & Christmas
            var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
            var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
            return `${diffHrs}h:${diffMins}m`;
        },
        weather: function () {
            if (this.openWeather.weather.length < 1) {
                return {};
            }
            return this.openWeather.weather[0];
        },
        nightmode: function () {
            if (!this.openWeather.sys) {
                return true;
            }
            const now = new Date().getTime() / 1000;
            const sunrise = this.openWeather.sys.sunrise;
            const sunset = this.openWeather.sys.sunset;
            return (now < sunrise) || (now > sunset)
        }
    },
    methods: {
        translate: function (label) {
            return this.dict[label.replace(/\s{2,}/g, ' ').trim()] || label;
        },
        lastValue: function (data, unit) {
            const values = data[unit];
            if (!values) {
                return '';
            }

            const timepoints = Object.keys(values);
            const lastTime = timepoints[timepoints.length - 1];
            return values[lastTime];
        },
        isKnownUnit: function (label) {
            return (label in this.dict);
        },
        timestampToTime: function (ts) {
            var date = new Date(ts * 1000);
            var hours = date.getHours();
            var minutes = '0' + date.getMinutes();
            var seconds = '0' + date.getSeconds();
            // return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
            return hours + ':' + minutes.substr(-2);
        },
        onSatelliteClick: function (picture) {
            this.radarVisible = picture.img;
        },
        getSatelliteImage: function (picture) {
            if (typeof picture.img === "function") {
                return picture.img.call(this);
            } else {
                return picture.img;
            }
        }
    },
    mounted: function () {
        window.onfocus = function () {
            const seconds = (new Date().getTime() - store.initializedTime.getTime()) / 1000;
            if (seconds > 1800) { // every 30 minutes
                window.location.reload(true);
            }

        };
    },
    created: function () {
        fetch('https://tdvorak-toolbox.now.sh/weather.js')
            .then(response => response.json())
            .then(myJson => {
                window.weather.setSalzburgWeather(myJson);
            });
        fetch('https://tdvorak-toolbox.now.sh/warnings.js')
            .then(response => response.json())
            .then(myJson => {
                window.weather.setWarnings(myJson);
            });
        fetch('https://tdvorak-toolbox.now.sh/lawine.js')
            .then(response => response.json())
            .then(myJson => {
                console.log(JSON.parse(JSON.stringify(myJson)));
                window.weather.setLawine(myJson);
            });

    }
});
