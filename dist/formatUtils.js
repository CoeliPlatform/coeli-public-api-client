"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getProperties(hasProperties) {
    const keysWithoutMetadata = hasProperties
        ? Object.keys(hasProperties).filter((p) => !p.startsWith('$'))
        : [];
    return keysWithoutMetadata
        .filter((p) => p != 'href')
        .map((x) => {
        return { key: x, value: hasProperties[x] };
    });
}
function isPrimitiveValue(x) {
    return (!!x &&
        (isImage(x) ||
            (!!x &&
                x.$metadata &&
                x.$metadata.$type &&
                x.$metadata.$type.$type == 'ValueType')));
}
function isBoolean(x) {
    return (!!x &&
        x.$metadata &&
        x.$metadata.$type &&
        x.$metadata.$type.name == 'Bool');
}
function isDecimal(value) {
    return value && !isImage(value) && value.$metadata.$type.name == 'Decimal';
}
function isIntegral(value) {
    return value && !isImage(value) && value.$metadata.$type.name == 'Integral';
}
function isAutoNumeric(value) {
    return (value && !isImage(value) && value.$metadata.$type.name == 'AutoNumeric');
}
function isEmbedded(x) {
    return (!isImage(x) &&
        x.$metadata &&
        x.$metadata.$type &&
        x.$metadata.$type.$type == 'EmbeddedType');
}
function isMedia(x) {
    return (!!x &&
        !!x.original &&
        !!x.public &&
        !!x.mimeType);
}
function isImage(x) {
    return isMedia(x) && x.mimeType.value.startsWith('image/');
}
function isVideo(x) {
    const mimeType = (isMedia(x) && !!x.mimeType && x.mimeType.value) ||
        '';
    return mimeType.startsWith('video/') && !isPublicVideoStream(x);
}
function isPublicVideoStream(x) {
    const mimeType = (isMedia(x) && !!x.mimeType && x.mimeType.value) ||
        '';
    const stream = !!(isMedia(x) && !!x.stream && x.stream.value) &&
        x.stream.value.includes('public');
    return mimeType.startsWith('video/') && stream;
}
function isPdf(x) {
    const mimeType = (isMedia(x) && !!x.mimeType && x.mimeType.value) || '';
    return mimeType == 'application/pdf';
}
function isAudio(x) {
    const mimeType = (isMedia(x) && !!x.mimeType && x.mimeType.value) ||
        '';
    return mimeType.startsWith('audio/');
}
function isReference(x) {
    return !!x.href;
}
function isIllegalValue(x) {
    return !!x.cause;
}
function isCycleReference(x) {
    return !!x.references;
}
function isRepeatedValue(t) {
    return !!(t &&
        t.values);
}
function isCalculatedValue(v) {
    return !!(v && v.isCalculated);
}
function isSingleValue(x) {
    return (!!x &&
        (isPrimitiveValue(x) ||
            isIllegalValue(x) ||
            isReference(x) ||
            isEmbedded(x)));
}
function isValue(x) {
    return (!x || // NullValue
        isRepeatedValue(x) ||
        isSingleValue(x));
}
function isDating(value) {
    return value && value.year && typeof value.bc !== 'undefined';
}
function isCoeliDate(value) {
    return !!(value &&
        value.year &&
        value.month &&
        value.day &&
        typeof value.bc !== 'undefined');
}
function formatNumber(n, locale, maxDecimals, minDecimals = maxDecimals) {
    return n.toLocaleString(locale, {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
    });
}
function myPadStart(num, length, char) {
    let text = num.toString();
    return text.length >= length
        ? text
        : char.repeat(length - text.length) + text;
}
function orEmpty(x) {
    return x ? x : '';
}
function dateTemplate(locale) {
    const d = new Date(2000, 5, 13);
    const str = d.toLocaleDateString(locale);
    // Javascript Date's month starts from zero.
    return str.replace('2000', 'year').replace('6', 'month').replace('13', 'day');
}
function formatDate(d, locale) {
    const year = (d.bc ? '-' : '') + myPadStart(d.year, 4, '0');
    const month = myPadStart(d.month, 2, '0');
    const day = myPadStart(d.day, 2, '0');
    if (locale == 'iso') {
        return `${year}-${month}-${day}`;
    }
    else {
        const template = dateTemplate(locale);
        return template
            .replace('year', year)
            .replace('month', month)
            .replace('day', day);
    }
}
function formatDating(d, locale) {
    if (d.display)
        return d.display;
    const year = (d.bc ? '-' : '') + myPadStart(d.year, 4, '0');
    const mid = isCoeliDate(d)
        ? formatDate(d, locale)
        : d.month
            ? `${myPadStart(d.month, 2, '0')}/${year}`
            : year;
    return orEmpty(d.uncertaintyBefore) + mid + orEmpty(d.uncertaintyAfter);
}
const isoDateRegex = /^(-?\d{4})-(\d{2})-(\d{2})$/;
function isIsoDate(text) {
    return isoDateRegex.test(text);
}
function createDating(value, year, month, day, bc = false) {
    return {
        value: value,
        year: year,
        month: month,
        day: day,
        bc: bc,
        $metadata: {
            $type: {
                $type: 'ValueType',
                name: 'Dating',
            },
        },
    };
}
function createTokenNl(token) {
    return {
        value: token,
        $metadata: {
            $type: {
                $type: 'ValueType',
                name: 'TokenNl',
            },
        },
    };
}
function fromIsoDate(text) {
    const res = isoDateRegex.exec(text);
    if (res && res.length == 4) {
        const year = parseInt(res[1]);
        return createDating(text, Math.abs(year), parseInt(res[2]), parseInt(res[3]), year < 0);
    }
    else {
        console.error('Date not in ISO format: ', text);
        return createTokenNl(text);
    }
}
function isPeriodInterval(value) {
    return value.$metadata.$type.name === 'PeriodInterval';
}
function isDatingInterval(value) {
    return value.$metadata.$type.name === 'DatingInterval';
}
function isChronologicalPeriod(value) {
    return value.$metadata.$type.references === 'ChronologicalPeriod';
}
function formattedEntity(locale, e) {
    const props = getProperties(e);
    function loop(value) {
        if (isSingleValue(value)) {
            if (isPrimitiveValue(value)) {
                if (isDecimal(value))
                    return (formatNumber(value.value, locale, 2) + value.$metadata.$type.unit ||
                        '');
                else if (isIntegral(value))
                    return (formatNumber(value.value, locale, 0) + value.$metadata.$type.unit ||
                        '');
                else if (isAutoNumeric(value))
                    return (formatNumber(value.value, locale, 0) + value.$metadata.$type.unit ||
                        '');
                else if (isImage(value)) {
                    return {
                        original: value.original.value,
                        large: value.large && value.large.value,
                        medium: value.medium && value.medium.value,
                        small: value.small && value.small.value,
                        public: value.public.value,
                        fileName: value.fileName && value.fileName.value,
                    };
                }
                else if (isDating(value))
                    return formatDating(value, locale);
                else if (isCoeliDate(value))
                    return formatDate(value, locale);
                else if (isIsoDate(String(value.value)))
                    return formatDate(fromIsoDate(String(value.value)), locale);
                else if (value.value === null)
                    return '';
                else
                    return value.value;
            }
            else if (isIllegalValue(value))
                return value.value + ' -> ' + value.cause;
            else {
                //isEmbedded or Reference
                if (isPeriodInterval(value)) {
                    return value.since.label.value + ' - ' + value.until.label.value;
                }
                else if (isDatingInterval(value)) {
                    return value.label.value;
                }
                else if (isChronologicalPeriod(value)) {
                    return value.label.value;
                }
                const embOrRefProps = getProperties(value);
                const res = {};
                return embOrRefProps.reduce((prev, curr) => {
                    prev[curr.key] = loop(curr.value);
                    return prev;
                }, {});
            }
        }
        else if (isRepeatedValue(value)) {
            return value.values.map((x) => loop(x));
        }
        else
            return '';
    }
    const result = {};
    props
        .map((x) => [x.key, loop(x.value)])
        .forEach((x) => (result[x[0]] = x[1]));
    return Object.assign({ $metadata: e.$metadata }, result);
}
exports.formattedEntity = formattedEntity;
