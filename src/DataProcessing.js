/* global chrome, define, module */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            './config.js',
            './utils.js',
            './Data.js'
        ], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(
            require('./config.js'),
            require('./utils.js'),
            require('./Data.js')
        );
    } else {
        root.DataProcessing = factory(
            root.config,
            root.utils,
            root.Data
        );
    }
}(this, (config, utils, Data) => {

    return class DataProcessing extends Data {

        /**
         * Constructor same as in Data class
         * @param {string} dataName
         */
        constructor(dataName) {
            super(dataName);
        }

        /**
         * Sorts descending tables
         * @param {Array} array
         * @param {number} indexToCompare
         * @returns {*|void}
         */
        static sortDescending(array, indexToCompare) {
            return array.sort(function (a, b) {
                return b[indexToCompare] - a[indexToCompare];
            });
        }

        /**
         * Creates map, where keys are numbers, and value is the same for every key
         * @param {number} numberOfKeys
         * @param {*} value
         * @param {number} [startNumber=0]
         * @returns {Object}
         */
        static createSimpleMap(numberOfKeys, value, startNumber = 0) {
            let newObj = {};

            for (let i = startNumber; i < numberOfKeys + startNumber; i++) {
                newObj[i] = value;
            }

            return newObj;
        }

        /**
         * Converts key to first element, and value to second element of an array
         * Returns Array of arrays
         * @param {Object} obj
         * @returns {Array[]}
         */
        static convertSimpleObjectToArray(obj) {
            let newArray = [];

            for (let key in obj) {
                if (!obj.hasOwnProperty(key)) continue;

                newArray.push([
                    key,
                    obj[key]
                ]);
            }

            return newArray;
        }

        /**
         * Convert 1 to Monday, 2 to Tuesday etc.
         * @param {number} dayNumber
         * @returns {string}
         */
        static convertDayOfTheWeekToName(dayNumber) {
            const daysMap = {
                1: 'Monday',
                2: 'Tuesday',
                3: 'Wednesday',
                4: 'Thursday',
                5: 'Friday',
                6: 'Saturday',
                7: 'Sunday'
            };

            return daysMap[dayNumber];
        }

        /**
         * Parse seconds into time in format 00d00h00m00s
         * @todo if 00m then minutes do not appear
         * @param {number} seconds
         * @returns {string}
         */
        static parseSecondsIntoTime(seconds) {

            const oneDay = 60 * 60 * 24;
            const oneHour = 60 * 60;
            const oneMinute = 60;

            let time = {
                days: '',
                hours: '',
                minutes: '',
                seconds
            };


            if (time.seconds > oneDay) {
                time.days = Math.floor(time.seconds / oneDay);
                time.seconds -= (time.days * oneDay);
                time.days = time.days + 'd';
            }

            if (time.seconds > oneHour) {
                time.hours = Math.floor(time.seconds / oneHour);
                time.seconds -= (time.hours * oneHour);
                time.hours = time.days ? ('0' + time.hours).slice(-2) + 'h' : time.hours + 'h';
            }

            if (time.seconds > oneMinute) {
                time.minutes = Math.floor(time.seconds / oneMinute);
                time.seconds -= (time.minutes * oneMinute);
                time.minutes = time.hours ? ('0' + time.minutes).slice(-2) + 'm' : time.minutes + 'm';
            }

            time.seconds = time.minutes ? ('0' + time.seconds).slice(-2) + 's' : time.seconds + 's';

            return `${time.days}${time.hours}${time.minutes}${time.seconds}`;
        }

        /**
         * Gets all years object from data
         * @returns {Array}
         */
        getAllYears() {
            let allYears = [];
            for (let hostname in this.data) {
                if (!this.data.hasOwnProperty(hostname) || !this.isThisHostnameData(hostname)) continue;

                let years = this.data[hostname];
                for (let year in years) {
                    if (!years.hasOwnProperty(year) || typeof years[year] !== 'object') continue;

                    allYears.push([
                        year,
                        years[year]
                    ]);
                }
            }

            return allYears;
        }

        getAllQuarters() {
            return this.getAllStatsInGivenParentUnit(this.getAllYears());
        }

        getAllDaysOfTheWeek() {
            let allYears = this.getAllYears();
            let allDaysOfTheWeek = [];
            let weekDetails;

            for (let i = 0; i < allYears.length; i++) {
                weekDetails = allYears[i][1][config.WEEK_DETAILS];

                for (let key in weekDetails) {
                    if (!weekDetails.hasOwnProperty(key)) continue;

                    allDaysOfTheWeek.push([
                        key,
                        weekDetails[key]
                    ]);
                }
            }

            return allDaysOfTheWeek;
        }

        getAllMonths() {
            return this.getAllStatsInGivenParentUnit(this.getAllYears());
        }

        getAllDays() {
            return this.getAllStatsInGivenParentUnit(this.getAllMonths());
        }

        getAllHours() {
            return this.getAllStatsInGivenParentUnit(this.getAllDays());
        }

        getAllMinutes() {
            return this.getAllStatsInGivenParentUnit(this.getAllHours());
        }

        /**
         *
         * @param parentUnit
         * @returns {Array}
         */
        getAllStatsInGivenParentUnit(parentUnit) {
            let unit;
            let all = [];

            for (let i = 0; i < parentUnit.length; i++) {
                unit = parentUnit[i][1];

                for (let key in unit) {
                    if (!unit.hasOwnProperty(key) || typeof unit[key] !== 'object') continue;

                    all.push([
                        key,
                        unit[key]
                    ]);
                }
            }

            return all;
        }

        /**
         * Returns an array with pages visited in given period
         * @param {string} methodName (getToday|getYesterday)
         * @param {string} [period]
         * @returns {Array}
         */
        getPagesVisitedInGivenPeriod(methodName, period) {

            let pagesArray = [];
            let data = this.data;
            for (let key in data) {
                if (!data.hasOwnProperty(key)) continue;
                if (this.isThisHostnameData(key) && this[methodName](key, period)) {
                    pagesArray.push([
                        key,
                        this[methodName](key, period)[config.ALL_TIME],
                        data[key][config.FAVICON_URL]
                    ]);
                }
            }
            return pagesArray;
        }

        /**
         * Checks is this hostname data by checking if it is data property, and has all_time property
         * @param {string} hostname
         * @returns {boolean}
         */
        isThisHostnameData(hostname) {
            return typeof this.data[hostname] === 'object' && !!this.data[hostname][config.ALL_TIME];
        }

        getTimeSpentInHours() {
            let hoursMap = this.constructor.createSimpleMap(24, 0);

            for (let hostname in this.data) {
                if (!this.data.hasOwnProperty(hostname)) continue;
                if (this.isThisHostnameData(hostname)) {
                    let today = this.getTodayData(hostname);
                    for (let hour in today) {
                        if (hour !== config.ALL_TIME) {
                            hoursMap[hour] += today[hour][config.ALL_TIME];
                        }
                    }
                }
            }

            return this.constructor.convertSimpleObjectToArray(hoursMap);
        }

        getTimeSpentInMinutes() {
            let minutesMap = this.constructor.createSimpleMap(60, 0);

            for (let hostname in this.data) {
                if (!this.data.hasOwnProperty(hostname) || !this.isThisHostnameData(hostname)) continue;

                let today = this.getTodayData(hostname);
                for (let hour in today) {
                    if (hour !== config.ALL_TIME) {
                        for (let minute in today[hour]) {
                            if (minute !== config.ALL_TIME) {
                                minutesMap[minute] += today[hour][minute];
                            }
                        }
                    }
                }
            }

            return this.constructor.convertSimpleObjectToArray(minutesMap);
        }

        getTimeSpentInDaysOfTheWeek() {
            let daysOfTheWeekMap = this.constructor.createSimpleMap(7, 0, 1);

            for (let hostname in this.data) {
                if (!this.data.hasOwnProperty(hostname) || !this.isThisHostnameData(hostname)) continue;

                // @todo if this will launch at the beginning of new year, there will be a problem
                let weekDetails = this.getYearData(hostname)[config.WEEK_DETAILS];
                let currentWeek = utils.getCurrentWeekOfTheYear();
                let dayOfTheWeek;
                let weekOfTheYear;
                for (let week in weekDetails) {
                    if (!weekDetails.hasOwnProperty(week)) continue;

                    weekOfTheYear = week.split('-')[0];
                    dayOfTheWeek = week.split('-')[1];

                    if (weekOfTheYear === currentWeek) {
                        daysOfTheWeekMap[dayOfTheWeek] += weekDetails[week];
                    }
                }
            }

            return this.constructor.convertSimpleObjectToArray(daysOfTheWeekMap);
        }

        proceedDataProcessing() {
            this.alltime = this.constructor.parseSecondsIntoTime(this.data[config.ALL_TIME]);

            let pagesVisitedTodayArrayData = this.constructor.sortDescending(this.getPagesVisitedInGivenPeriod('getTodayData'), 1);
            this.pagesVisitedToday = {
                data: (function () {
                    let arr = [];
                    let other = 0;
                    for (let i = 0; i < pagesVisitedTodayArrayData.length; i++) {
                        if (i < 10) {
                            arr.push(pagesVisitedTodayArrayData[i][1]);
                        } else {
                            other += pagesVisitedTodayArrayData[i][1];
                        }
                    }
                    arr.push(other);
                    return arr;
                })(),
                labels: (function () {
                    pagesVisitedTodayArrayData = pagesVisitedTodayArrayData.map((page) => page[0]).slice(0, 10);
                    pagesVisitedTodayArrayData[10] = 'Other';
                    return pagesVisitedTodayArrayData;
                })()
            };

            let pagesVisitedYesterdayArrayData = this.constructor.sortDescending(this.getPagesVisitedInGivenPeriod('getYesterdayData'), 1);
            this.pagesVisitedYesterday = {
                data: pagesVisitedYesterdayArrayData.map((page) => page[1]).slice(0, 10),
                labels: pagesVisitedYesterdayArrayData.map((page) => page[0]).slice(0, 10)
            };

            let pagesVisitedThisMonthArrayData = this.constructor.sortDescending(this.getPagesVisitedInGivenPeriod('getMonthData'), 1);
            this.pagesVisitedThisMonth = {
                data: pagesVisitedThisMonthArrayData.map((page) => page[1]).slice(0, 10),
                labels: pagesVisitedThisMonthArrayData.map((page) => page[0]).slice(0, 10)
            };

            let pagesVisitedLastMonthArrayData = this.constructor.sortDescending(this.getPagesVisitedInGivenPeriod('getMonthData', utils.getLastMonth()), 1);
            this.pagesVisitedLastMonth = {
                data: pagesVisitedLastMonthArrayData.map((page) => page[1]).slice(0, 10),
                labels: pagesVisitedLastMonthArrayData.map((page) => page[0]).slice(0, 10)
            };

            let timeSpentInHoursDataArray = this.getTimeSpentInHours();
            this.timeSpentInHours = {
                data: timeSpentInHoursDataArray.map(hour => Math.round(hour[1] / 60)),
                labels: timeSpentInHoursDataArray.map(hour => hour[0])
            };

            let timeSpentInHoursTotalDataArray = this.getAllHours();
            let timeMap = this.constructor.createSimpleMap(24, 0);
            timeSpentInHoursTotalDataArray.map((time) => {
                timeMap[time[0]] += time[1][config.ALL_TIME];
            });
            timeSpentInHoursTotalDataArray = this.constructor.convertSimpleObjectToArray(timeMap);
            this.timeSpentInHoursTotal = {
                data: timeSpentInHoursTotalDataArray.map(hour => Math.round(hour[1] / 60)),
                labels: timeSpentInHoursTotalDataArray.map(hour => hour[0])
            };

            let timeSpentInMinutesDataArray = this.getTimeSpentInMinutes();
            this.timeSpentInMinutes = {
                data: timeSpentInMinutesDataArray.map(minute => minute[1]),
                labels: timeSpentInMinutesDataArray.map(minute => minute[0])
            };

            let timeSpentEachDayOfTheWeekDataArray = this.getTimeSpentInDaysOfTheWeek();
            this.timeSpentEachDayOfTheWeek = {
                data: timeSpentEachDayOfTheWeekDataArray.map(dayOfTheWeek => Math.round(dayOfTheWeek[1] / 60)),
                labels: timeSpentEachDayOfTheWeekDataArray.map(dayOfTheWeek => this.constructor.convertDayOfTheWeekToName(dayOfTheWeek[0]))
            };
        }
    };

}));