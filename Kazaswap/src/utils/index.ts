String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.capitalizeFirst = function () {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

String.prototype.toCamelCase = function () {
return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
}).replace(/\s+/g, "");
};

String.prototype.toKebabCase = function () {
    return this.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
};

export const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

export const timeAgo = (time:number) => {
    const timeMsAgo = new Date().getTime() - new Date(time).getTime()
    const timeMinAgo = timeMsAgo ? Math.floor(timeMsAgo / 1000 / 60) : null
    const timeHourAgo = timeMinAgo ? Math.floor(timeMinAgo / 60) : null
    const timeDayAgo = timeHourAgo ? Math.floor(timeHourAgo / 24) : null
    const timeWeekAgo = timeDayAgo ? Math.floor(timeDayAgo / 7) : null
    const timeMonthAgo = timeWeekAgo ? Math.floor(timeWeekAgo / 4) : null
    const timeYearAgo = timeMonthAgo ? Math.floor(timeMonthAgo / 12) : null
    
    let timeAgo
    if(timeMinAgo === null) {
        timeAgo = 'Just now'
    } else if(timeMinAgo && timeMinAgo < 60) {
        timeAgo = `${timeMinAgo} min ago`
    } else if(timeHourAgo && timeHourAgo < 24) {
        timeAgo = `${timeHourAgo} hrs ago`
    } else if(timeDayAgo && timeDayAgo < 7) {
        timeAgo = `${timeDayAgo} dys ago`
    } else if(timeWeekAgo && timeWeekAgo < 4) {
        timeAgo = `${timeWeekAgo} wks ago`
    } else if(timeMonthAgo && timeMonthAgo < 12) {
        timeAgo = `${timeMonthAgo} mth ago`
    } else if(timeYearAgo) {
        timeAgo = `${timeYearAgo} yrs ago`
    }

    return timeAgo
}