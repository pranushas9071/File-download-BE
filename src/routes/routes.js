const gridController = require("../controllers/gird/index");

const routes = (app) => {
    app.use((req, res, next) => {
        res.set({
            'Access-Control-Allow-Origin': "http://localhost:4200",
            'Access-Control-Allow-Methods': 'GET,POST,PUT,HEAD,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'content-Type,x-requested-with'
        });
        next();
    });

    app.get("/getGridData", gridController.getGridData);
    app.get("/download/excel", gridController.excelWriter);
    app.get("/download/pdf", gridController.pdfWriter);
}

module.exports = routes;
