var sleepStartTime = 0;
function sleep(sec) {
    sleepStartTime = Date.now();
    sec *= 1000;
    while (true) {
        if (Date.now() - sleepStartTime >= sec) {
            break;
        }
    }
}
module.exports = sleep;

