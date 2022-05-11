const mockData = require("../../../mockdata");

class Grid {

    getData(req, res) {
        res.send({ headers: mockData.headers, data: mockData.data }).status(200);
    }

}

const grid = new Grid();

module.exports = grid;
