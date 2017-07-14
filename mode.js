module.exports = {
    port: 4000,
    internal_port: 3000,
    internal_proxy: 'http://localhost:3000',
    basepath: '/',
    is_developer_mode: true,
    open_on_start: true,
    watch: true, //falseにすると自前でappを起動しないといけないので注意
    minify_js: false
};