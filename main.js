document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("img.clouds").onclick = function () {
        document.querySelector("div.clouds").style.display = 'block';
        document.querySelector("div.radar").style.display = 'none';
    };
    document.querySelector("img.radar").onclick = function () {
        document.querySelector("div.clouds").style.display = 'none';
        document.querySelector("div.radar").style.display = 'block';
    };
});

const store = {
    debug: true,
    initializedTime: new Date(),
    state: {
        salzburgWeather: null,
        openWeather: {
            sys:null
        },
        dict: {
            'Lufttemperatur [GradC]': 'temp',
            'rel. Luftfeuchte [%]': 'humidity',
            'Windgeschwindigkeit [m/s]': 'wind',
            'Windrichtung [Grad]': 'wind-dir',
            'Windspitze [m/s]': 'wind-max',
            'Luftdruck [hPa]': 'pressure',
            'Sonnenscheindauer [min]': 'sun'
        }
    },
    setSalzburgWeather: function (data) {
        if (this.debug) console.log('setSalzburgWeather triggered with', JSON.parse(JSON.stringify(data)));
        this.state.salzburgWeather = data;
    },
    setOpenWeather: function (data) {
        if (this.debug) console.log('setOpenWeather triggered with', JSON.parse(JSON.stringify(data)));
        store.state.openWeather = data;
    }
};

window.weather = store;

Vue.component('temp', {
    props: ['value'],
    template: '<span v-if="value" v-bind:class="{ negative: value.startsWith(\'-\')}">{{value}}°</span>'
});
Vue.component('humidity', {
    props: ['value'],
    computed:  {
        styleObject: function () {
            return {
                background: 'linear-gradient(to left, rgba(85, 252, 246, 0.4) ' + this.value + '%, #fff ' + this.value + '%'
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
    computed:  {
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
    computed:  {
        lastMeasurement: function () {
            const types = Object.keys(this.measurements);
            const timepoints = Object.keys(this.measurements[types[0]]);
            const lastTime = timepoints[timepoints.length - 1];
            const regex = /(\d{2}).(\d{2}).(\d{4})\s(\d{2}):(\d{2})/g;
            const match = regex.exec(lastTime);
            if(match) {
                // Array [ "10.04.2018 07:00", "10", "04", "2018", "07", "00" ]
                const d = new Date(match[3], match[2] -1, match[1], match[4], match[5], 0, 0);
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
            console.log('Headers', result);
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
            return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        },

    },
    mounted: function () {
        window.onfocus = function () {
            const seconds = (new Date().getTime() - store.initializedTime.getTime()) / 1000;
            if (seconds > 1800) { // every 30 minutes
                window.location.reload(true);
            }

        };
    }
});
